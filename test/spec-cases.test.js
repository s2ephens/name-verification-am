import test from "node:test";
import assert from "node:assert/strict";

import { verifyCandidate } from "../src/verifier.js";

const CASES = [
  // Expected Matches (1-18)
  ["Tyler Bliha", "Tlyer Bilha", true],
  ["Al-Hilal", "alhilal", true],
  ["Dargulov", "Darguloff", true],
  ["Bob Ellensworth", "Robert Ellensworth", true],
  ["Mohammed Al Fayed", "Muhammad Alfayed", true],
  ["Sarah O'Connor", "Sara Oconnor", true],
  ["Jonathon Smith", "Jonathan Smith", true],
  ["Abdul Rahman ibn Saleh", "Abdulrahman ibn Saleh", true],
  ["Al Hassan Al Saud", "Al-Hasan Al Saud", true],
  ["Katherine McDonald", "Catherine Macdonald", true],
  ["Yusuf Al Qasim", "Youssef Alkasim", true],
  ["Steven Johnson", "Stephen Jonson", true],
  ["Alexander Petrov", "Aleksandr Petrof", true],
  ["Jean-Luc Picard", "Jean Luc Picard", true],
  ["Mikhail Gorbachov", "Mikhail Gorbachev", true],
  ["Elizabeth Turner", "Liz Turner", true],
  ["Omar ibn Al Khattab", "Omar Ibn Alkhattab", true],
  ["Sean O'Brien", "Shawn Obrien", true],
  // Expected Non-matches (19-30)
  ["Emanuel Oscar", "Belinda Oscar", false],
  ["Michael Thompson", "Michelle Thompson", false],
  ["Ali Hassan", "Hassan Ali", false],
  ["John Smith", "James Smith", false],
  ["Abdullah ibn Omar", "Omar ibn Abdullah", false],
  ["Maria Gonzalez", "Mario Gonzalez", false],
  ["Christopher Nolan", "Christian Nolan", false],
  ["Ahmed Al Rashid", "Ahmed Al Rashidi", false],
  ["Samantha Lee", "Samuel Lee", false],
  ["Ivan Petrov", "Ilya Petrov", false],
  ["Fatima Zahra", "Zahra Fatima", false],
  ["William Carter", "Liam Carter", false],
];

test("verifier matches spec cases", () => {
  for (const [target, candidate, expected] of CASES) {
    const res = verifyCandidate(candidate, target);
    assert.equal(
      res.match,
      expected,
      `target=${JSON.stringify(target)} candidate=${JSON.stringify(candidate)} got=${res.match} conf=${res.confidence.toFixed(
        2,
      )} reason=${res.reason}`,
    );
  }
});



