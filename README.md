# Dining Philosophers Problem

This repository contains a Node.js implementation of the classic Dining Philosophers concurrency problem. Your task is to implement three deadlock-prevention algorithms using async/await.

## Problem Description

Five philosophers sit at a circular table with five forks between them. Each philosopher alternates between thinking and eating. To eat, a philosopher needs both adjacent forks. The challenge is to prevent deadlock while ensuring all philosophers can eventually eat.

## Getting Started

```bash
npm install
```

## Your Task

Implement the following methods in `philosophers.js`:

1. **`Philosopher.prototype.startAsym(meals)`** - Asymmetric algorithm
   - Even-numbered philosophers pick up left fork first, then right
   - Odd-numbered philosophers pick up right fork first, then left

2. **`Philosopher.prototype.startConductor(meals, conductor)`** - Conductor/Waiter algorithm
   - Implement the `Conductor` class to limit concurrent diners
   - Philosophers request permission before picking up forks

3. **`Philosopher.prototype.startSimultaneous(meals)`** - Simultaneous fork pickup
   - Acquire both forks atomically (all-or-nothing)
   - Must directly access `fork.state` instead of using `fork.acquire()`

The `Fork.acquire()` method and naive algorithm (`startNaive()`) are provided as reference implementations.

## Testing Your Implementation

### Run specific algorithm tests:

```bash
# Test only asymmetric algorithm
npm run test:asymmetric

# Test only conductor algorithm
npm run test:conductor

# Test only simultaneous algorithm
npm run test:simultaneous

# Run all tests
npm test
```

### Generate logs and analyze behavior:

```bash
# Run single algorithm with 10 meals
node run-experiments.js asymmetric 10

# Run all algorithms with 100 meals (default)
node run-experiments.js

# Run with custom meal count
node run-experiments.js conductor 50
```

Logs are saved to the `logs/` directory in JSONL format.


## Implementation Notes

### Fork Acquisition with BEB

The `Fork.acquire(requesterId, forkIds)` method uses Binary Exponential Backoff:
- Returns a promise that resolves when the fork is acquired
- Automatically retries with increasing delays if the fork is busy
- Logs `TRY` when attempting and `ACQUIRE` when successful

### Event Logging

All philosopher actions are automatically logged:
- `TRY` - Attempting to acquire fork(s)
- `ACQUIRE` - Successfully acquired fork(s)
- `EAT_START` - Started eating
- `EAT_END` - Finished eating
- `RELEASE` - Released fork(s)
- `TIMEOUT` - Released left fork due to timeout (naive-timeout only)

### What the Tests Check

The automated tests verify:
1. **Completion** - All philosophers complete the required number of meals
2. **Mutual Exclusion** - No two adjacent philosophers eat simultaneously
3. **Event Sequences** - Proper ordering of TRY/ACQUIRE/EAT/RELEASE events
4. **Fairness** - No philosopher is starved (all complete their meals)

## Files

- `philosophers.js` - Student template (implement your solutions here)
- `run-experiments.js` - Experiment runner and log generator
- `philosophers.test.js` - Automated test suite

## Grading

Your implementation will be automatically tested via GitHub Actions. Points are awarded for:
- Asymmetric algorithm: 30 points (20 completion + 10 mutual exclusion)
- Conductor algorithm: 30 points (20 completion + 10 mutual exclusion)
- Simultaneous algorithm: 40 points (20 completion + 10 mutual exclusion + 10 atomicity)

Total: 100 points