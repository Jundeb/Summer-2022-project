import "./css/Main.css"

import NotFound from './NotFound';
import LogOut from "./LogOut";
import Transfer from "./Transfer";
import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom"
import axios from "./api/axios";
import UserContext from "./context/userProvider";

const Main = () => {
    const { user, setUser } = useContext(UserContext);

    const [update, setUpdate] = useState(false);
    const [userInfo, setUserInfo] = useState({ firstname: '', lastname: '', address: '', phonenumber: '' });
    const [debitAccount, setDebitAccount] = useState({ accountId: '', accountNumber: '', balance: '', limit: '' });
    const [creditAccount, setCreditAccount] = useState({ accountId: '', accountNumber: '', balance: '', limit: '' });
    const [logOut, setLogOut] = useState(false);

    const [creditSuccess, setCreditSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    //gets user data everytime updates state changes
    useEffect(() => {
        const getUser = async () => {
            try {
                const response = await axios.post(`/user`,
                    JSON.stringify({ userId: user.userId }),
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + user.accessToken
                        },
                        withCredentials: true
                    }
                );

                setUserInfo({
                    firstname: response.data.personalInfo.firstname,
                    lastname: response.data.personalInfo.lastname,
                    address: response.data.personalInfo.address,
                    phonenumber: response.data.personalInfo.phonenumber
                });

                setDebitAccount({
                    accountId: response.data.account1.accountId,
                    accountNumber: response.data.account1.accountNumber,
                    balance: response.data.account1.balance,
                    limit: response.data.account1.limit
                });

                if (response.data?.account2) {
                    setCreditAccount({
                        accountId: response.data.account2.accountId,
                        accountNumber: response.data.account2.accountNumber,
                        balance: response.data.account2.balance,
                        limit: response.data.account2.limit
                    });
                }
            } catch (err) {
                if (err.response.status === 401 || err.response.status === 403) {
                    handleLogOut();
                }
            }
        }
        getUser();
        setUpdate(false);
    }, [update]);

    //gets a new accessToken everytime user enters this page
    useEffect(() => {
        const refresh = async () => {
            try {
                const response = await axios.get('/refresh', {
                    withCredentials: true
                });

                setUser(prev => {
                    return { ...prev, accessToken: response.data.accessToken }
                });

            } catch (error) {
                if (error.response.status === 403) {
                    handleLogOut();
                }
            }
        }
        refresh();
    }, []);

    //tries to create a credit account for user
    const handleCreditCreate = async () => {
        try {
            const response = await axios.post('/account',
                JSON.stringify({ username: user.username }),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + user.accessToken
                    },
                    withCredentials: true
                });

            setCreditSuccess(true);
            setErrorMessage('');

        } catch (error) {

            setCreditSuccess(false);

            if (!error?.response) {
                setErrorMessage('No Server Response');
            }
            else if (error.response?.status === 204) {
                setErrorMessage('Server Error');
            }
            else if (error.response?.status === 403) {
                setErrorMessage('Credit account already exists.');
            }
            else {
                setErrorMessage('Action Failed');
            }
        }
    }

    //sets User to null and sends a request to server which clears cookies
    const handleLogOut = async () => {

        setUser(null);
        setLogOut(true);

        try {
            const response = await axios.get('/logout', {
                withCredentials: true
            });

        } catch (error) {
            console.log(error.response);
        }
    }

    return (
        <>
            {logOut === false && user.accessToken !== null
                ?
                <>
                    {user.userId
                        ?
                        <section>
                            <div className="infoDiv">
                                <h4>Personal Info </h4>
                                {userInfo.firstname !== ''
                                    ? <span>{userInfo.firstname + " " + userInfo.lastname}</span>
                                    : " -"
                                }
                                <br />
                                {userInfo.address !== ''
                                    ? <span>{userInfo.address}</span>
                                    : " -"
                                }
                                <br />
                                {userInfo.phonenumber !== ''
                                    ? <span>{userInfo.phonenumber}</span>
                                    : " -"
                                }
                                <div className="infoUpdate">
                                    <h5>Want to update info?</h5>
                                    <Link to="/updateInfo">
                                        <button className="updateInfoButton">
                                            Update Info
                                        </button>
                                    </Link>
                                </div>
                            </div>
                            <div className="accountsDiv">
                                <h3>Accounts</h3>
                                <Transfer setUpdate={setUpdate} debit={debitAccount.accountNumber} credit={creditAccount.accountNumber} debitBalance={debitAccount.balance} creditBalance={creditAccount.balance} />
                                <div className="accountsButtonDiv">
                                    <Link to="/accounts/0">
                                        <button>
                                            {"Debit " + debitAccount.balance + "€"}
                                        </button>
                                    </Link>
                                </div>
                                {creditAccount.accountNumber !== ''
                                    ? <div className="accountsButtonDiv">
                                        <Link to="/accounts/1">
                                            <button>
                                                {"Credit " + creditAccount.balance + "€"}
                                            </button>
                                        </Link></div>
                                    : null
                                }
                            </div>
                            {creditAccount.accountNumber === ''
                                ?
                                <div className="creditDiv">
                                    {creditSuccess
                                        ?
                                        <div className="successCredit">
                                            <h3> Success! </h3>
                                            <h4>New credit account created. </h4>
                                            <p>Your Credit limit is automatically
                                                set to 2000. When you login next time
                                                your credit account should appear under Accounts:</p>
                                        </div>
                                        : <div>
                                            <h4> Don't have an credit account?</h4>
                                            <span className="error">
                                                {errorMessage}
                                            </span>
                                            <button onClick={handleCreditCreate} className="createCreditButton">
                                                Create Credit Account
                                            </button>
                                        </div>
                                    }
                                </div>
                                : null
                            }
                            <div className="bottom">
                                <button onClick={handleLogOut}>Log Out</button>
                                <p className="forgottenPassword">
                                    <Link to="/changepassword">Change Password</Link>
                                </p>
                            </div>

                        </section>
                        : <NotFound />
                    }
                </>
                : <LogOut />
            }
        </>
    )
}

export default Main;