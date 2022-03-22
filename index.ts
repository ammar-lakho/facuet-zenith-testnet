import { ethers } from 'ethers';
import express from 'express';
import rateLimit from 'express-rate-limit'
require('dotenv').config();

const port = process.env.PORT || 3000;
let provider: ethers.providers.JsonRpcProvider
let wallet: ethers.Wallet;
let faucetAmount: ethers.BigNumber;
const app = express();

app.use('/request-funds', getRateLimiter(60*60*1000, 1));
app.use(express.json());

app.post('/request-funds', async(req, res) => {
    if (!req.body.address) {
        return res.status(400).send({"error": "missing address"});
    }
    if(process.env.PRIVATE_KEY) {
        let gasPrice = await provider.getGasPrice();
        let tx = await wallet.sendTransaction({
            to: req.body.address,
            value: faucetAmount,
            gasPrice: gasPrice,
            gasLimit: 21000,
        });
        res.status(200).send({"tx hash": tx.hash});
    }
})

app.get('/balance', async (req, res) => {
    const balance = await provider.getBalance(wallet.address);
    res.send({"balance": balance.toString()})
})


app.listen(port, () => {
    if (process.env.FAUCET_AMOUNT)
        faucetAmount = ethers.utils.parseEther(process.env.FAUCET_AMOUNT);
    else 
        faucetAmount = ethers.utils.parseEther("0.1");
    provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    if (process.env.PRIVATE_KEY && process.env.RPC_URL) {
        wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        console.log(`Example app listening on port ${port}`)
    }
    else {
        throw new Error("Missing env variables");
    }
})

function getRateLimiter(periodInMs: number, maxRequests: number) {
    return rateLimit({
        windowMs: periodInMs, // 1 minutes (in ms)
        max: maxRequests, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    })
    
}