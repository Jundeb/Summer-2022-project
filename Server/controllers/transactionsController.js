const User = require('../models/User');

const transferHandler = async (req, res) => {
    const account1_accountNumber = req.body.account1_accountNumber;
    const account2_accountNumber = req.body.account2_accountNumber;

    let account1_num = 0;
    let account2_num = 0;

    const amount = parseInt(req.body.amount);
    const transferMethod = req.body.method;

    if(account1_accountNumber === account2_accountNumber) return res.status(409).json({'message': 'Transaction not allowed'});
    if (!account1_accountNumber || !account2_accountNumber || !amount) return res.status(400).json({ 'message': 'Account numbers and amount required' });

    const foundUser1 = await User.findOne({ "bank_accounts.account_number": account1_accountNumber }).exec();
    const foundUser2 = await User.findOne({ "bank_accounts.account_number": account2_accountNumber }).exec();

    if (!foundUser1 || !foundUser2) return res.status(400).json({ 'message': 'No accounts found.' });

    const userAccount1 = foundUser1.bank_accounts.filter(user => user.account_number === account1_accountNumber);
    const userAccount2 = foundUser2.bank_accounts.filter(user => user.account_number === account2_accountNumber);

    if (userAccount1[0].limit !== 0) {
        account1_num = 1;
    }

    if (userAccount2[0].limit !== 0) {
        account2_num = 1;
    }

    const balance1 = foundUser1.bank_accounts[account1_num].balance;
    const balance2 = foundUser2.bank_accounts[account2_num].balance;

    const limit = foundUser1.bank_accounts[account1_num].limit;

    if (transferMethod === "transfer") {

        if (account1_num === 0 && balance1 < amount) return res.status(406).json({ 'message': 'User1 balance too low.' });

        if (account1_num === 1 && -limit > balance1 - amount) return res.status(406).json({ 'message': 'User1 limit reached.' });

        foundUser1.bank_accounts[account1_num].balance = balance1 - amount;
        foundUser2.bank_accounts[account2_num].balance = balance2 + amount;

        const d = new Date();

        //creating new transaction and pushing it to relevant account
        foundUser1.bank_accounts[account1_num].transactions.push({
            'from': account1_accountNumber,
            'to': account2_accountNumber,
            'amount': amount,
            'date': d.toLocaleString(),
            'transaction_name': 'Send'
        });

        //creating new transaction and pushing it to relevant account
        foundUser2.bank_accounts[account2_num].transactions.push({
            'from': account1_accountNumber,
            'to': account2_accountNumber,
            'amount': amount,
            'date': d.toLocaleString(),
            'transaction_name': 'Receive'
        });

        if (foundUser1.username === foundUser2.username) {
            foundUser1.bank_accounts[account2_num].balance = foundUser2.bank_accounts[account2_num].balance;
            foundUser1.bank_accounts[account2_num].transactions = foundUser2.bank_accounts[account2_num].transactions;

            const result = await foundUser1.save();
        } else {
            const result = await foundUser1.save();
            const result2 = await foundUser2.save();
        }
    }
    res.status(200).json({"message": "Success"});
}


module.exports = { transferHandler };