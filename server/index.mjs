'use strict';

/*** Importing modules ***/
import express from 'express';
import morgan from 'morgan';                                  // logging middleware
import cors from 'cors';
import db from './db.mjs';
import session from 'express-session'; // session middleware

/*
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
*/

/** Authentication-related imports **/
import passport from 'passport';                              // authentication middleware
import { Strategy as LocalStrategy } from 'passport-local';   // authentication strategy (username and password)

import { check, validationResult } from 'express-validator'; // validation middleware

import budgetDao from './dao-budget.mjs';
import userDao from './dao-users.mjs'; // module for accessing the user table in the DB

/*** init express and set-up the middlewares ***/
const app = express();
app.use(morgan('dev')); // set-up logging
app.use(express.json())
app.use('/static', express.static('public'));// serve per caricare le immagini

/*
const mongoStore = new MongoStore({
  mongooseConnection: mongoose.connection,
  collection: 'sessions',
  mongoUrl: 'mongodb://localhost:5173',
  autoRemove: 'native', // Optional: Auto-remove expired sessions
});
*/


/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(session({
  secret: 'secret phrase budget sociale', resave: false, saveUninitialized: false
}));
/*
app.use(session({
  secret: 'xxxxyyyyzzzz',
  resave: false,
  saveUninitialized: false,
  store: mongoStore,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
}));
*/ 
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

/*** Passport ***/

/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, username, name).
 **/
passport.use(new LocalStrategy((username, password, callback) => {
  userDao.getUser(username, password).then((user) => {
    if(!user)
      return callback(null, false, 'Incorrect username or password')
    callback(null, user);
  }).catch((err) => {
    callback(null, false, err)
  });
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser((user, callback) => {
  callback(null, { id: user.id, email: user.email, name: user.name, role: user.role });
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) { // this user is id + email + name 
  // if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
  // e.g.: return userDao.getUserById(id).then(user => callback(null, user)).catch(err => callback(err, null));
  
  return callback(null, user); // this will be available in req.user
});

app.use(passport.authenticate('session'));


/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Admins only' });
};

/*** Users APIs ***/


// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => { 
    if (err)
      return next(err);
      if (!user) {
        // display wrong login messages
        return res.status(401).json({ error: info });
      }
      // success, perform the login and extablish a login session
      req.login(user, (err) => {
        if (err)
          return next(err);
        
        // req.user contains the authenticated user, we send all the user info back
        // this is coming from userDao.getUser() in LocalStratecy Verify Fn
        return res.json(req.user);
      });
  })(req, res, next);
});

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);
  }else{
    res.status(401).json({error: 'Not authenticated'});
  } 
});

// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});


/*** Associations APIs ***/

// HOME

// GET /api/associations
// This route return the list of associations (one in this case) for the home page
app.get('/api/associations', async (req, res) => {
  try {
    const association = await budgetDao.associationInfo();

    res.status(200).json(association);
  } catch (err) {
    res.status(500).json(err);
  }
})

// PHASE 0

// PATCH /api/associations/association/set-budget
// This route is used by the admin for setting the budget
app.patch('/api/associations/association/set-budget', isLoggedIn, isAdmin, async (req, res) => {
  try{
    const budget = req.body.budget
    if(budget == null){
      return res.status(400).json({error: 'Missing required fields'});
    }
    
    if(budget < 0){
      return res.status(400).json({error: 'Invalid budget value'});
    }
    
    const current_phase = await budgetDao.getPhase();
    if(current_phase != 0){
      return res.status(400).json({error: 'Invalid current phase'})
    }
    
    await budgetDao.setBudget(req.user.id, budget);
    
    res.status(200).json({ message: `Budget updated at ${budget}` });
  } catch (error) {
    res.status(500).json(error);
  }
})

// PATCH /api/associations/association/budget
// This route is used for upgrade the phase from 0 to 1 by the admin
app.patch('/api/associations/association/budget', isLoggedIn, isAdmin, async(req, res) => {

  const current_phase = await budgetDao.getPhase();
  try{
    if(current_phase !== 0){
      return res.status(400).json({error: 'Invalid current phase'})
    }

    await budgetDao.upgradePhase(req.user.id, 1);

    res.status(200).json({ message: `Phase has been update to 1` });
  } catch (error) {
    res.status(500).json(error);
  }
})

// PHASE 1

// GET /api/associations/association/proposals
// This route is used to performe the get of all existing proposals by the logged user
app.get('/api/associations/association/proposals',isLoggedIn, async (req, res) => {
  try{
    const current_phase = await budgetDao.getPhase();

    if(current_phase !== 1){
      return res.status(400).json({error: 'Invalid current phase'})
    }

    const proposals = await budgetDao.getProposalsByID(req.user.id)
    res.status(200).json({ proposals: proposals || [] });
  }catch(error){
    res.status(400).json(error)
  }
})

// POST /api/associations/association/proposals
// This route is used to perform the creation of a proposal by a logged User
app.post('/api/associations/association/proposals', isLoggedIn, async (req, res) => {
  try{
    const current_phase = await budgetDao.getPhase();

    if(current_phase !== 1){
      return res.status(400).json({error: 'Invalid current phase'})
    }

    const { budget, description } = req.body;

    if (budget == null || description == null || description == '') {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const PID = await budgetDao.createProposalByID(req.user.id, description, budget)

    res.status(200).json({PID: PID, budget: budget, description: description})
  }catch(error){
    res.status(400).json(error)
  }
})

// PATCH /api/associations/association/proposals
// This  route is used to perform the edit of an existing proposal by the creator ( must to be logged )
app.patch('/api/associations/association/proposals', isLoggedIn, async (req, res) => {
  try{
    const current_phase = await budgetDao.getPhase();

    if(current_phase !== 1){
      return res.status(400).json({error: 'Invalid current phase'})
    }
    
    const { PID, budget, description } = req.body;

    if (PID == null || budget == null || description == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    await budgetDao.editProposalByID(req.user.id, PID, budget, description);

    res.status(200).json({PID: PID, budget: budget, description: description})
  }catch(error){
    res.status(400).json(error)
  }
})

// DELETE /api/associations/association/proposals
// This  route is used to perform the delete of an existing proposal by the creator ( must to be logged )
app.delete('/api/associations/association/proposals', isLoggedIn, async (req, res) => {
  try{
    const current_phase = await budgetDao.getPhase();

    if(current_phase !== 1){
      return res.status(400).json({error: 'Invalid current phase'})
    }
    const PID = req.body.PID;

    if (PID == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await budgetDao.deleteProposalByID(req.user.id, PID)

    res.status(200).json({message: `Proposal ${PID} has been deleted successfully`})
  }catch(error){
    res.status(400).json(error)
  }
})

// PATCH /api/associations/association/proposals/upgrade
// This route is used for upgrade the phase from 1 to 2 by the admin
app.patch('/api/associations/association/proposals/upgrade', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const current_phase = await budgetDao.getPhase();

    if(current_phase !== 1){
      return res.status(400).json({error: 'Invalid current phase'})
    }

    const proposals = await budgetDao.getAllProposals();
    if(proposals.length == 0){
      return res.status(400).json({error: 'No proposals presented'})
    }
    
    await budgetDao.upgradePhase(req.user.id, 2);

    res.status(200).json({ message: 'Phase upgraded successfully' });
  } catch (error) {
    res.status(500).json(error);
  }
})

// PHASE 2

// GET /api/associations/association/votes
// This route is used for get all the proposals done by all users
app.get('/api/associations/association/votes', isLoggedIn, async (req, res) => {
  try {
    const current_phase = await budgetDao.getPhase();

    if(current_phase !== 2){
      return res.status(400).json({error: 'Invalid current phase'})
    }

    const proposals = await budgetDao.getAllProposals()
    return res.status(200).json(proposals)
  }catch(error){
    return res.status(400).json(error)
  }
})

// GET /api/associations/association/votes/get-votes
// This route is used for get all the votes done by the logged user
app.get('/api/associations/association/votes/get-votes', isLoggedIn, async (req, res) => {
  try {
    const current_phase = await budgetDao.getPhase();

    if(current_phase !== 2){
      return res.status(400).json({error: 'Invalid current phase'})
    }

    const votes = await budgetDao.getVotesByID(req.user.id)
    return res.status(200).json(votes)

  }catch(error){
    return res.status(400).json(error)
  }
})

// POST /api/associations/association/votes
// This route is used for the creation of a valutation for one specific proposal by a logged user
app.post('/api/associations/association/votes', isLoggedIn, async (req, res) => {
  try{
    const current_phase = await budgetDao.getPhase();

    if(current_phase !== 2){
      return res.status(400).json({error: 'Invalid current phase'})
    }
    const valutation = req.body.value
    if(valutation < 1 || valutation > 3){
      return res.status(400).json({error: 'Invalid valutation value'})
    }
    const PID = req.body.PID;

    if (PID == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing_proposal = await budgetDao.checkProposalByPID(PID)
    if(existing_proposal == 0){
      return res.status(400).json({error: 'No existing proposal with this PID'});
    }

    const voteCount = await budgetDao.checkVoteByUser(PID, req.user.id)
    if (voteCount > 0){
      return res.status(400).json({error: 'Multi valutation error'})
    }
    await budgetDao.setVoteByID(PID, valutation, req.user.id)
    return res.status(200).json({message: `The vote has been created successfully for the proposal ${PID}`})
  }catch(error){
    return res.status(400).json(error)
  }
})

// DELETE /api/associations/association/votes
// This route is used for delete a valutation for one specific proposal made by a logged user
app.delete('/api/associations/association/votes', isLoggedIn, async (req, res) => {
  try{
    const current_phase = await budgetDao.getPhase();

    if(current_phase !== 2){
      return res.status(400).json({error: 'Invalid current phase'})
    }

    const PID = req.body.PID;

    if (PID == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const voteCount = await budgetDao.checkVoteByUser(PID, req.user.id)
    if (voteCount == 0){
      return res.status(400).json({error: 'No valutation to delete for this PID'})
    }

    await budgetDao.deleteVoteByID(PID, req.user.id)
    res.status(200).json({message: `Vote has been deleted successfully`})
  }catch(error){
    res.status(400).json(error)
  }
})

// PATCH /api/associations/association/votes
// This route is used for upgrade the phase from 2 to 3 by the admin
app.patch('/api/associations/association/votes', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const current_phase = await budgetDao.getPhase();

    if(current_phase !== 2){
      return res.status(400).json({error: 'Invalid current phase'})
    }
    
    await budgetDao.upgradePhase(req.user.id, 3);

    res.status(200).json({ message: 'Phase upgraded successfully' });
  } catch (error) {
    res.status(500).json(error);
  }
})

// PHASE 3

// GET /api/associations/association/results
// This route is used for get the results of the previous phase e return all the proposals with the total votes ordered by a descent order
app.get('/api/associations/association/results', async (req, res) => {
  try {
    const current_phase = await budgetDao.getPhase();

    if (current_phase !== 3) {
      return res.status(400).json({ error: 'Invalid current phase' });
    }

    const proposalsWithTotalVotes = await budgetDao.markProposalsAsTaken();
    res.status(200).json(proposalsWithTotalVotes);
  } catch (error) {
    res.status(400).json(error);
  }
});

// DELETE /api/associations/association/results
// This route is used for resetting the social budget decision of the association by the Admin
app.delete('/api/associations/association/results', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const current_phase = await budgetDao.getPhase();

    if(current_phase !== 3){
      return res.status(400).json({error: 'Invalid current phase'})
    }

    await budgetDao.deleteVotes();
    await budgetDao.deleteProposals();
    await budgetDao.resetPhaseBudget();
    res.status(200).json({ message: 'Phase reset successfully' });

  }catch(error){
    res.status(400).json(error)
  }
})

// Activating the server
const PORT = 3001;
app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}/`));