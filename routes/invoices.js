const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const router = express.Router();

function validateCompCode(req, res, next) {
	const { comp_code } = req.body;
	if (!comp_code)
		throw new ExpressError("Body of request is missing comp_code", 400);
	return next();
}

function validateAmt(req, res, next) {
	const { amt } = req.body;
	if (!amt) throw new ExpressError("Body of request is missing amt", 400);
	return next();
}

// function validateAmt(req, res, next) {
// 	const { name, description } = req.body;
// 	if (!name) throw new ExpressError("Body of request is missing name", 400);
// 	if (!description)
// 		throw new ExpressError("Body of request is missing description", 400);
// 	return next();
// }

router.get("/", async (req, res, next) => {
	try {
		const results = await db.query("SELECT * FROM invoices;");
		return res.json({ invoices: results.rows });
	} catch (e) {
		return next(e);
	}
});

router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const results = await db.query("SELECT * FROM invoices WHERE id=$1", [id]);
		if (results.rows.length === 0)
			throw new ExpressError(`Invoice with id of ${id} not found`, 404);
		return res.json({ invoice: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.post("/", validateCompCode, validateAmt, async (req, res, next) => {
	try {
		const { comp_code, amt } = req.body;

		const results = await db.query(
			"INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *",
			[comp_code, amt]
		);
		return res.json({ invoice: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.patch("/:id", validateAmt, async (req, res, next) => {
	try {
		const { id } = req.params;
		const { amt } = req.body;
		const results = await db.query(
			"UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *",
			[amt, id]
		);
		if (results.rows.length === 0)
			throw new ExpressError(`Invoice with id of ${id} not found`, 404);
		return res.json({ invoice: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.delete("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const results = await db.query(
			`DELETE FROM invoices WHERE id=$1 RETURNING *`,
			[id]
		);
		if (results.rows.length === 0)
			throw new ExpressError(`Invoice with id of ${id} not found`, 404);
		return res.json({ message: "Deleted" });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
