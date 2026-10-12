# TaskFlow

CLI task tracker (internship project).

## What was tough

### Week 1:

- Creating Set requires iterable to be passed, and only the first one is considered, iterated and creates Set;
- Dates work differently depending on what is passed or which method is called. "2026-10-20" is parsed as UTC, while other formats are parsed as local time. new Date("garbage") doesn't throw, it returns an Invalid Date. getDay() is the day of the week, not the day of the month;
- Expected splice(-1, 1) to throw, but instead deleted the last element;
- reduce() should return accumulator for the next iteration, not modified property (just forgot about it).

All those were resolved by reading manual and asking AI.
