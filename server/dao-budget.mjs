'use script';

import db from './db.mjs';
import crypto from 'crypto';

export const associationInfo = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Associations';
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                if (!rows) {
                    resolve([]);
                } else {
                    const associations = rows.map((val) => ({
                        Name: val.Name,
                        Budget: val.Budget,
                        Phase: val.Phase,
                        Admin: val.Admin,
                        URI: val.URI,
                        Description: val.Description
                    }));
                    resolve(associations);
                }
            }
        });
    });
};

export const setBudget = (UserID, Budget) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE Associations SET Budget=? WHERE Admin=?'
        db.run(sql, [Budget, UserID], (err) => {
            if(err){
                reject({error: 'Error in the update of the budget'})
            }else{
                resolve(true)
            }
        })
    })
}

export const createProposalByID = (UserID, Description, Budget) => {
    return new Promise((resolve, reject) => {
        // Prima verifica il numero di proposte esistenti per l'utente
        const countSql = 'SELECT COUNT(*) as count FROM Proposals WHERE UserID = ?';
        db.get(countSql, [UserID], (err, row) => {
            if (err) {
                reject(err);
            } else {
                const proposalCount = row.count;
                if (proposalCount >= 3) {
                    // Se l'utente ha già 3 o più proposte, rifiuta l'operazione
                    reject('User already has 3 proposals');
                } else {
                    // Altrimenti, inserisci la nuova proposta
                    const insertSql = 'INSERT INTO Proposals(Description, Budget, UserID, IsTaken) VALUES (?, ?, ?, 0)';
                    db.run(insertSql, [Description, Budget, UserID], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(this.lastID);
                        }
                    });
                }
            }
        });
    });
};

export const getProposalsByID = (UserID) => {
    return new Promise((resolve,reject) => {
        const sql = 'SELECT * FROM Proposals WHERE UserID=?'
        db.all(sql, UserID, (err, rows) => {
            if(err){ 
                reject(err);
            }else if (!rows || rows.length === 0){
                resolve([]);
            }else{
                const myProposals = rows.map((values) => ({
                    PID: values.PID,
                    Description: values.Description,
                    Budget: values.Budget}));
                resolve(myProposals);
            }
        });
    });
};

export const getAllProposals = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Proposals'
        db.all(sql, (err, rows) => {
            if(err){
                reject(err)
            }else if(!rows || rows.length === 0){
                resolve([])
            }else{
                const proposals = rows.map((values) => ({
                    PID: values.PID,
                    Description: values.Description,
                    Budget: values.Budget,
                    UserID: values.UserID
                }));
                resolve(proposals)
            }
        })
    })
}

export const editProposalByID = (UserID, PID, Budget, Description) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE Proposals SET Budget=?, Description=? WHERE UserID=? AND PID=?';
        db.run(sql, [Budget, Description, UserID, PID], (err) => {
            if(err){
                console.error('SQL error:', err);
                reject(err)
            }else{
                resolve(true)
            }
        })
    })
}

export const deleteProposalByID = (UserID, PID) => {
    return new Promise((resolve, reject)=>{
        const sql = 'DELETE FROM Proposals WHERE UserID=? AND PID=?'
        db.run(sql,[UserID,PID],(err)=>{
            if(err){
                reject(err)
            }else{
                resolve(true)
            }
        })
    })
}

export const getPhase = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT Phase FROM Associations';
        db.get(sql, (err, row) => {
            if (err) {
                reject({ error: 'Cannot get the phase value' });
            } else if (!row) {
                reject({error: 'Association not found'});
            } else {
                resolve(row.Phase);
            }
        });
    });
};

export const upgradePhase = (UserID, Phase) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE Associations SET Phase=? WHERE Admin=?'
        db.run(sql, [Phase, UserID], (err) => {
            if(err){
                reject({error: 'Error in the upgrade of the phase'})
            }else{
                resolve(true)
            }
        })
    })
}

export const checkVoteByUser = (PID, UserID) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) as voteCount FROM votes WHERE PID = ? AND UserID = ?';
        db.get(sql, [PID, UserID], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.voteCount);
            }
        });
    });
};

export const checkProposalByPID = (PID) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) as proposalCount FROM Proposals WHERE PID = ?';
        db.get(sql, [PID], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.proposalCount);
            }
        });
    });
};

export const setVoteByID = (PID, Value, UserID) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO Votes(PID, Value, UserID) VALUES (?,?,?)'
        db.run(sql, [PID, Value, UserID], (err) => {
            if(err){
                reject(err)
            }else{
                resolve(true)
            }
        })
    })
}

export const deleteVoteByID = (PID, UserID) => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM Votes WHERE PID=? AND UserID=?'
        db.run(sql, [PID, UserID], (err)=>{
            if(err){
                reject(err)
            }else{
                resolve(true)
            }
        })
    })
}

export const getVotesByID = (UserID) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Votes WHERE UserID=?'
        db.all(sql,[UserID],(err, rows) => {
            if(err){
                reject(err)
            }else if (!rows || rows.length === 0){
                resolve([]);
            }else{
                const votes = rows.map((val) => ({
                    VID: val.VID,
                    PID: val.PID,
                    Value: val.Value,
                    UserID: val.UserID }));
                resolve(votes);
            }
        })
    })
}

export const getProposalsWithTotalVotes = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                p.PID,
                p.Description,
                p.Budget,
                p.UserID,
                p.IsTaken,
                COALESCE(SUM(v.Value), 0) as totalVotes
            FROM 
                Proposals p
            LEFT JOIN 
                Votes v ON p.PID = v.PID
            GROUP BY 
                p.PID, p.Description, p.Budget, p.UserID, p.IsTaken
            ORDER BY 
                totalVotes DESC
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};
/*
export const markProposalsAsTaken = async () => {
    try {
        const associations = await associationInfo();
        const totalBudget = associations[0].Budget; // Assuming single association
        const proposals = await getProposalsWithTotalVotes();
        
        let remainingBudget = totalBudget;
        let lastTotalVotes = proposals[0].totalVotes
        let flag = false

        for (const proposal of proposals) {
            if (proposal.Budget <= remainingBudget) {
                // Nel caso in cui c'è già stata una proposta con budget > remainingBudget
                // posso prendere un'altra proposta solo se a parità di voto 
                if(flag && lastTotalVotes != proposal.totalVotes)
                    break;
                flag = false
                proposal.IsTaken = 1
                remainingBudget -= proposal.Budget;
                const updateSql = 'UPDATE Proposals SET IsTaken = ? WHERE PID = ?';
                await new Promise((resolve, reject) => {
                    db.run(updateSql, [proposal.IsTaken, proposal.PID], (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(true);
                        }
                    });
                });
            } else {
                lastTotalVotes = proposal.totalVotes
                flag = true
            } 
        }
        return proposals;
    } catch (error) {
        throw error;
    }
};*/

export const markProposalsAsTaken = async () => {
    try {
        const associations = await associationInfo();
        if (!associations || associations.length === 0) {
            throw new Error("No associations found.");
        }

        const totalBudget = associations[0].Budget; // Assuming single association
        const proposals = await getProposalsWithTotalVotes();

        let remainingBudget = totalBudget;
        let lastTotalVotes = proposals[0].totalVotes;
        let flag = false;

        const updatePromises = [];

        for (const proposal of proposals) {
            if (proposal.Budget <= remainingBudget) {
                // Nel caso in cui c'è già stata una proposta con budget > remainingBudget
                // posso prendere un'altra proposta solo se a parità di voto
                if (flag && lastTotalVotes !== proposal.totalVotes) {
                    break;
                }
                flag = false;
                proposal.IsTaken = 1;
                remainingBudget -= proposal.Budget;

                const updateSql = 'UPDATE Proposals SET IsTaken = ? WHERE PID = ?';
                const updatePromise = new Promise((resolve, reject) => {
                    db.run(updateSql, [proposal.IsTaken, proposal.PID], (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(true);
                        }
                    });
                });

                updatePromises.push(updatePromise);
            } else {
                lastTotalVotes = proposal.totalVotes;
                flag = true;
            }
        }

        // Await all update promises
        await Promise.all(updatePromises);

        return proposals;
    } catch (error) {
        console.error("Error marking proposals as taken:", error.message);
        throw error;
    }
};

export const deleteVotes = () => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM Votes';
        db.run(sql, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
};

export const deleteProposals = () => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM Proposals';
        db.run(sql, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
};

export const resetPhaseBudget = () => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE Associations SET Phase=0, Budget=0';
        db.run(sql, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
};

export default {
    associationInfo,
    setBudget,
    createProposalByID,
    getProposalsByID,
    getAllProposals,
    editProposalByID,
    deleteProposalByID,
    getPhase,
    upgradePhase,
    checkVoteByUser,
    checkProposalByPID,
    setVoteByID,
    deleteVoteByID,
    getVotesByID,
    getProposalsWithTotalVotes,
    markProposalsAsTaken,
    deleteVotes,
    deleteProposals,
    resetPhaseBudget
};