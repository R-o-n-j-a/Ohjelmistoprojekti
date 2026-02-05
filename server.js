import express from "express";
const app = express();

app.use(express.static("public"));

app.get("/api/status", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(3000, () =>
    console.log("Server running on http://localhost:3000")
);
