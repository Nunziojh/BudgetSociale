const SERVER_URL = 'http://localhost:3001/api/';

/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> } 
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {

         // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
         response.json()
            .then( json => resolve(json) )
            .catch( err => reject({ error: "Cannot parse server response" }))

        } else {
          // analyzing the cause of error
          response.json()
            .then(obj => 
              reject(obj)
              ) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" })) // something else
        }
      })
      .catch(err => 
        reject({ error: "Cannot communicate"  })
      ) // connection error
  });
}

// HOME

const getAssociations = async () => {
  return getJson(
    fetch(SERVER_URL + 'associations', {
      method: 'GET'
    })
  );
};

// PHASE 0

const setBudget = async (budget) => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/set-budget', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ budget: budget })
    })
  );
};

const upgradeToPhase1 = async () => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/budget', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })
  );
};

// PHASE 1

const getProposalsByID = async () => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/proposals', {
      method: 'GET',
      headers: {
        'Content-Type':'application/json',
      },
      credentials: 'include'
    })
  );
};

const createProposal = async (description, budget) => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/proposals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ description: description, budget: budget })
    })
  );
};

const editProposal = async (PID, budget, description) => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/proposals', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ PID: PID, budget: budget, description: description })
    })
  );
};

const deleteProposal = async (PID) => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/proposals', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ PID: PID })
    })
  );
};

const upgradeToPhase2 = async () => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/proposals/upgrade', {
      method: 'PATCH',
      credentials: 'include',
    })
  );
};

// PHASE 2

const getProposalsForVoting = async () => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/votes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })
  );
};

const getVotesByID = async () => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/votes/get-votes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })
  );
};

const voteProposal = async (PID, value) => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ PID: PID, value: value })
    })
  );
};

const deleteVote = async (PID) => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/votes', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ PID: PID })
    })
  );
};

const upgradeToPhase3 = async () => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/votes', {
      method: 'PATCH',
      credentials: 'include',
    })
  );
};

// PHASE 3

const getResults = async () => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/results', {
      method: 'GET'
    })
  );
};

const resetPhases = async () => {
  return getJson(
    fetch(SERVER_URL + 'associations/association/results', {
      method: 'DELETE',
      credentials: 'include',
    })
  );
};

// AUTHENTICATION

/**
 * This function wants username and password inside a "credentials" object.
 * It executes the log-in.
   */
const logIn = async (credentials) => {
  return getJson(fetch(SERVER_URL + 'sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwared
    body: JSON.stringify(credentials),
  })
  )
};
  
/**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
  const response = await fetch(SERVER_URL + 'sessions/current', {
    // this parameter specifies that authentication cookie must be forwarded
    credentials: 'include'
  });

  if (response.ok) {
    const userInfo = await response.json();
    return { ...userInfo}; // Include the user ID in the returned object
  } else {
    const error = await response.json();
    throw error;
  }
};

/**
 * This function destroy the current user's session and execute the log-out.
 */
const logOut = async() => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    method: 'DELETE',
    credentials: 'include'  // this parameter specifies that authentication cookie must be forwared
  })
  )
}

const API = {
  logIn, getUserInfo, logOut, //authentication
  getAssociations, //home
  setBudget, upgradeToPhase1,  //phase 0
  getProposalsByID, createProposal, editProposal, deleteProposal, upgradeToPhase2, //phase 1
  getProposalsForVoting, getVotesByID, voteProposal, deleteVote, upgradeToPhase3, //phase 2
  getResults, resetPhases //phase 3
};
export default API;
  