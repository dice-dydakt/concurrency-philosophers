// Concurrency Theory, implementation of the Dining Philosophers problem in node.js
// Problem description: http://en.wikipedia.org/wiki/Dining_philosophers_problem

// Promisified delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Event log for analysis (JSONL format)
const eventLog = [];
let startTime = Date.now();
let currentAlgorithm = 'unknown';
let currentRunId = null;

function setAlgorithm(name) {
    currentAlgorithm = name;
}

function generateShortId() {
    return Math.random().toString(36).slice(2, 8);
}

function startRun(algorithm) {
    currentAlgorithm = algorithm || currentAlgorithm;
    currentRunId = generateShortId();
    startTime = Date.now();
    return currentRunId;
}

function log(philId, event, forks) {
    const entry = {
        runId: currentRunId,
        algorithm: currentAlgorithm,
        t: Date.now() - startTime,
        phil: philId,
        event: event,
        forks: forks
    };
    eventLog.push(entry);
    console.log(JSON.stringify(entry));
}

function getEventLog() {
    return eventLog;
}

function clearEventLog() {
    eventLog.length = 0;
}

// Fork class with async acquire using Binary Exponential Backoff (BEB)
class Fork {
    constructor(id) {
        this.id = id;
        this.state = 0;  // 0 = free, 1 = taken
        this.holder = null;
    }

    // Acquire fork using BEB algorithm:
    // 1. Before the first attempt, wait 1ms
    // 2. If fork is taken, double the wait time and retry
    // 3. On success, set state = 1 and holder = requesterId
    async acquire(requesterId, forks) {
        log(requesterId, 'TRY', forks);

        let waitTime = 1;
        const maxWait = 1000;

        while (true) {
            if (this.state === 0) {
                this.state = 1;
                this.holder = requesterId;
                log(requesterId, 'ACQUIRE', forks);
                return;
            }
            await delay(waitTime);
            waitTime = Math.min(waitTime * 2, maxWait);
        }
    }

    release(requesterId, forks) {
        if (this.holder !== requesterId) {
            throw new Error(`Philosopher ${requesterId} cannot release fork held by ${this.holder}`);
        }
        this.state = 0;
        this.holder = null;
        log(requesterId, 'RELEASE', forks);
    }
}

// Philosopher class
class Philosopher {
    constructor(id, forks) {
        this.id = id;
        this.forks = forks;
        this.f1 = id % forks.length;           // left fork
        this.f2 = (id + 1) % forks.length;     // right fork
    }

    log(event) {
        log(this.id, event, [this.f1, this.f2]);
    }

    // Naive algorithm - WARNING: This will DEADLOCK!
    // All philosophers pick up left fork first, then right fork.
    // When all grab their left fork simultaneously, no one can get a right fork.
    // This is provided as a reference implementation.
    async startNaive(count) {
        const forks = this.forks;
        const f1 = this.f1;
        const f2 = this.f2;

        for (let i = 0; i < count; i++) {
            // Pick up left fork first, then right
            await forks[f1].acquire(this.id, [f1, f2]);
            await forks[f2].acquire(this.id, [f1, f2]);

            // Eat - repeat this in every implementation
            this.log('EAT_START');
            await delay(1);
            this.log('EAT_END');

            // Release forks
            forks[f1].release(this.id, [f1, f2]);
            forks[f2].release(this.id, [f1, f2]);
        }
    }

    // Asymmetric solution
    // Odd philosophers: pick up left fork first, then right
    // Even philosophers: pick up right fork first, then left
    async startAsym(count) {
        const forks = this.forks;
        const f1 = this.f1;
        const f2 = this.f2;

        // TODO: Implement the asymmetric solution
    }

    // Conductor (butler/waiter) solution
    // Use a Conductor that limits the number of philosophers
    // that can attempt to eat simultaneously to N-
    async startConductor(count, conductor) {
        const forks = this.forks;
        const f1 = this.f1;
        const f2 = this.f2;

        // TODO: Implement the conductor solution
    }

    // Simultaneous fork pickup solution
    // Philosopher picks up both forks atomically or none at all
    // Use BEB for retrying when both forks are not available
    // Copy implementation from Fork.acquire to use the same settings
    // (for performance comparability)
    //
    // NOTE: In this implementation you need to access fork.state directly
    // (not use acquire/release methods) to check and set both forks atomically.
    // You must manually:
    // - Call log(this.id, 'TRY', [f1, f2]) when starting to acquire
    // - Check if BOTH forks[f1].state === 0 && forks[f2].state === 0
    // - If yes, set both states to 1, set holders, and call log(this.id, 'ACQUIRE', [f1, f2])
    // - If no, wait using BEB and retry
    // - Use forks[x].release() for releasing (this method can still be used)
    async startSimultaneous(count) {
        const forks = this.forks;
        const f1 = this.f1;
        const f2 = this.f2;

        // TODO: Implement the simultaneous fork pickup solution
    }
}

// Conductor class for the waiter solution
// Limits the number of philosophers that can eat at the same time
class Conductor {
    constructor(maxSeats) {
        this.seats = maxSeats;
        this.waiting = [];
    }

    // TODO: Implement requestSeat() - async method that waits if no seats available
    async requestSeat() {
    }

    // TODO: Implement leaveSeat() - frees a seat and wakes up waiting philosopher
    leaveSeat() {
    }
}

// Configuration
const N = 5;
const MEALS_PER_PHILOSOPHER = 10;

// Create forks and philosophers
const forks = Array.from({ length: N }, (_, i) => new Fork(i));
const philosophers = Array.from({ length: N }, (_, i) => new Philosopher(i, forks));

// Run the naive algorithm (will deadlock!)
async function main() {
    startRun('naive');
    console.log('Starting naive algorithm (will likely deadlock)...\n');

    await Promise.all(philosophers.map(p => p.startNaive(MEALS_PER_PHILOSOPHER)));

    console.log('\nAll philosophers finished eating.');
}

// Only run main() when executed directly, not when required as a module
if (require.main === module) {
    main().catch(console.error);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Fork,
        Philosopher,
        Conductor,
        N,
        MEALS_PER_PHILOSOPHER,
        getEventLog,
        clearEventLog,
        log,
        setAlgorithm,
        startRun,
        delay
    };
}
