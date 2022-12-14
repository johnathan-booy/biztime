process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let company;
let invoice;

beforeAll(async () => {
	await db.query(`DELETE FROM companies`);
	await db.query(`DELETE FROM invoices`);
});
beforeEach(async () => {
	const cResults = await db.query(
		`INSERT INTO
        companies
        (code, name, description)
        VALUES
        ('msft',
        'Microsoft Corporation',
        'Microsoft Corporation develops and supports software, services, devices, and solutions.')
        RETURNING
        code, name, description`
	);
	const iResults = await db.query(
		`INSERT INTO
        invoices (comp_code, amt, paid, paid_date)
        VALUES
        ('msft', 50, false, null)
        RETURNING
        id, comp_code, amt, paid, paid_date`
	);

	company = cResults.rows[0];
	invoice = iResults.rows[0];
});
afterEach(async () => {
	await db.query(`DELETE FROM companies`);
	await db.query(`DELETE FROM invoices`);
});
afterAll(async () => {
	await db.end();
});

describe("GET /companies", () => {
	test("Returns a list of companies", async () => {
		const res = await request(app).get("/companies");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ companies: [company] });
	});
});

describe("POST /companies", () => {
	beforeEach(() => {
		company = {
			code: "appl",
			name: "Apple Inc.",
			description: "They make things.",
		};
	});

	test("Creates a company", async () => {
		const res = await request(app).post("/companies").send(company);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ company: company });
	});

	test("Rejects missing company code", async () => {
		delete company.code;
		const res = await request(app).post("/companies").send(company);
		expect(res.statusCode).toBe(400);
	});

	test("Rejects missing company name", async () => {
		delete company.name;
		const res = await request(app).post("/companies").send(company);
		expect(res.statusCode).toBe(400);
	});

	test("Rejects missing company description", async () => {
		delete company.description;
		const res = await request(app).post("/companies").send(company);
		expect(res.statusCode).toBe(400);
	});
});

describe("GET /companies/:code", () => {
	test("Returns a company with given id", async () => {
		company.invoices = [invoice.id];
		const res = await request(app).get(`/companies/${company.code}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ company: company });
	});
	test("Returns 404 when company code is invalid", async () => {
		const res = await request(app).get(`/companies/ahsdvbkalsdbfjkabsdkjf`);
		expect(res.statusCode).toBe(404);
	});
});

describe("DELETE /companies/:code", () => {
	test("Deletes a company with given id", async () => {
		company.invoices = [invoice.id];
		const res = await request(app).delete(`/companies/${company.code}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ message: "Deleted" });
	});
	test("Returns 404 when company code is invalid", async () => {
		const res = await request(app).delete(`/companies/ahsdvbkalsdbfjkabsdkjf`);
		expect(res.statusCode).toBe(404);
	});
});

describe("PATCH /companies", () => {
	beforeEach(() => {
		company = {
			code: "msft",
			name: "March Software Fanatics Tussle",
			description: "They break things.",
		};
	});

	test("Updates a company", async () => {
		const res = await request(app)
			.patch(`/companies/${company.code}`)
			.send(company);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ company: company });
	});

	test("Rejects missing company name", async () => {
		delete company.name;
		const res = await request(app)
			.patch(`/companies/${company.code}`)
			.send(company);
		expect(res.statusCode).toBe(400);
	});

	test("Rejects missing company description", async () => {
		delete company.description;
		const res = await request(app)
			.patch(`/companies/${company.code}`)
			.send(company);
		expect(res.statusCode).toBe(400);
	});
});
