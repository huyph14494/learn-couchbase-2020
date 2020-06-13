import * as express from "express";

const app = express();

app.get("/", (req: any, res: any) => {
    res.send("Hello World")
})
const PORT = process.env.PORT || 3000;
app.listen(PORT, (): void => {
     console.log(`Server is running in http://localhost:${PORT}`)
})