const request = require('supertest');
const express = require('express');
const { readingValidation } = require('../src/validations/readingValidation');
const { validationResult } = require('express-validator');

// Create lightweight mock app with just the validation middleware
const app = express();
app.use(express.json());

app.post('/validate-reading', readingValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }
  return res.status(200).json({ valid: true });
});

describe('Reading Validation Rules (Kenpath Specification)', () => {
  const validPayload = {
    reading_date: '2024-01-15',
    time_slot: 'morning_fasting',
    value_mgdl: 95,
  };

  it('accepts a fully valid reading payload', async () => {
    const res = await request(app).post('/validate-reading').send(validPayload);
    expect(res.statusCode).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('rejects when glucose value is missing: "Please enter a glucose value."', async () => {
    const res = await request(app).post('/validate-reading').send({
      ...validPayload,
      value_mgdl: '',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Please enter a glucose value.');
  });

  it('rejects value below 40: "Value must be between 40 and 600 mg/dl."', async () => {
    const res = await request(app).post('/validate-reading').send({
      ...validPayload,
      value_mgdl: 39,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it('rejects value above 600: "Value must be between 40 and 600 mg/dl."', async () => {
    const res = await request(app).post('/validate-reading').send({
      ...validPayload,
      value_mgdl: 601,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it('rejects non-integer values: "Value must be between 40 and 600 mg/dl."', async () => {
    const res = await request(app).post('/validate-reading').send({
      ...validPayload,
      value_mgdl: 120.5,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it('rejects date in the future: "Date cannot be in the future."', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const dateStr = futureDate.toISOString().slice(0, 10);

    const res = await request(app).post('/validate-reading').send({
      ...validPayload,
      reading_date: dateStr,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Date cannot be in the future.');
  });

  it('rejects invalid time_slot not in the 4 allowed slots', async () => {
    const res = await request(app).post('/validate-reading').send({
      ...validPayload,
      time_slot: 'midnight_snack',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/time_slot must be one of/i);
  });
});
