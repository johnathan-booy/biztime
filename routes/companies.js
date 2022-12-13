const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const router = express.Router();

function validateCode(req, res, next) {
	const { code } = req.body;
	if (!code) throw new ExpressError("Body of request is missing code", 400);
	return next();
}
function validateInfo(req, res, next) {
	const { name, description } = req.body;
	if (!name) throw new ExpressError("Body of request is missing name", 400);
	if (!description)
		throw new ExpressError("Body of request is missing description", 400);
	return next();
}

router.get("/", async (req, res, next) => {
	try {
		const results = await db.query("SELECT * FROM companies;");
		return res.json({ companies: results.rows });
	} catch (e) {
		return next(e);
	}
});

router.get("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;

		// Get company info
		const compResults = await db.query(
			"SELECT * FROM companies WHERE code=$1",
			[code]
		);
		if (compResults.rows.length === 0)
			throw new ExpressError(`Company with code of ${code} not found`, 404);

		// Get company invoices
		const invoiceResults = await db.query(
			"SELECT id FROM invoices WHERE comp_code=$1",
			[code]
		);
		const invoices = invoiceResults.rows.map((i) => i.id);

		return res.json({
			company: { ...compResults.rows[0], invoices },
		});
	} catch (e) {
		return next(e);
	}
});

router.post("/", validateCode, validateInfo, async (req, res, next) => {
	try {
		const { code, name, description } = req.body;
		const results = await db.query(
			"INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *",
			[code, name, description]
		);
		return res.json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.patch("/:code", validateInfo, async (req, res, next) => {
	try {
		const { code } = req.params;
		const { name, description } = req.body;
		const results = await db.query(
			"UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *",
			[name, description, code]
		);
		if (results.rows.length === 0)
			throw new ExpressError(`Company with code of ${code} not found`, 404);
		return res.json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.delete("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const results = await db.query(
			`DELETE FROM companies WHERE code=$1 RETURNING *`,
			[code]
		);
		if (results.rows.length === 0)
			throw new ExpressError(`Company with code of ${code} not found`, 404);
		return res.json({ message: "Deleted" });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
