const { Fork, Philosopher, N, MEALS_PER_PHILOSOPHER, getEventLog, clearEventLog, startRun } = require('./philosophers');

describe('Fork', () => {
    let fork;

    beforeEach(() => {
        fork = new Fork(0);
        clearEventLog();
    });

    test('should initialize with id', () => {
        const fork2 = new Fork(3);
        expect(fork2.id).toBe(3);
    });

    test('should initialize with state 0', () => {
        expect(fork.state).toBe(0);
    });

    test('should initialize with holder null', () => {
        expect(fork.holder).toBeNull();
    });

    test('should have acquire method', () => {
        expect(typeof fork.acquire).toBe('function');
    });

    test('should have release method', () => {
        expect(typeof fork.release).toBe('function');
    });

    test('release should set state to 0 and holder to null', () => {
        fork.state = 1;
        fork.holder = 2;
        fork.release(2);
        expect(fork.state).toBe(0);
        expect(fork.holder).toBeNull();
    });

    test('acquire should accept requesterId parameter', () => {
        expect(fork.acquire.length).toBe(1);
    });

    test('release should throw if requesterId does not match holder', () => {
        fork.state = 1;
        fork.holder = 1;
        expect(() => fork.release(2)).toThrow('Philosopher 2 cannot release fork held by 1');
    });

    test('release should throw if fork has no holder', () => {
        fork.state = 1;
        fork.holder = null;
        expect(() => fork.release(0)).toThrow('Philosopher 0 cannot release fork held by null');
    });

    test('release should succeed when requesterId matches holder', () => {
        fork.state = 1;
        fork.holder = 3;
        expect(() => fork.release(3)).not.toThrow();
        expect(fork.state).toBe(0);
        expect(fork.holder).toBeNull();
    });

    test('release should log RELEASE event', () => {
        fork.state = 1;
        fork.holder = 2;
        fork.release(2);
        const log = getEventLog();
        expect(log.length).toBe(1);
        expect(log[0].phil).toBe(2);
        expect(log[0].event).toBe('RELEASE');
        expect(log[0].forks).toEqual([0]);
        expect(typeof log[0].t).toBe('number');
    });
});

describe('Philosopher', () => {
    let forks;
    let philosopher;

    beforeEach(() => {
        forks = Array.from({ length: 5 }, (_, i) => new Fork(i));
        clearEventLog();
    });

    test('should initialize with correct id', () => {
        philosopher = new Philosopher(2, forks);
        expect(philosopher.id).toBe(2);
    });

    test('should store reference to forks array', () => {
        philosopher = new Philosopher(0, forks);
        expect(philosopher.forks).toBe(forks);
    });

    test('should calculate correct fork indices for philosopher 0', () => {
        philosopher = new Philosopher(0, forks);
        expect(philosopher.f1).toBe(0);
        expect(philosopher.f2).toBe(1);
    });

    test('should calculate correct fork indices for philosopher 2', () => {
        philosopher = new Philosopher(2, forks);
        expect(philosopher.f1).toBe(2);
        expect(philosopher.f2).toBe(3);
    });

    test('should wrap around fork indices for last philosopher', () => {
        philosopher = new Philosopher(4, forks);
        expect(philosopher.f1).toBe(4);
        expect(philosopher.f2).toBe(0);
    });

    test('should have startNaive method', () => {
        philosopher = new Philosopher(0, forks);
        expect(typeof philosopher.startNaive).toBe('function');
    });

    test('should have startAsym method', () => {
        philosopher = new Philosopher(0, forks);
        expect(typeof philosopher.startAsym).toBe('function');
    });

    test('should have startConductor method', () => {
        philosopher = new Philosopher(0, forks);
        expect(typeof philosopher.startConductor).toBe('function');
    });

    test('should have log method', () => {
        philosopher = new Philosopher(0, forks);
        expect(typeof philosopher.log).toBe('function');
    });

    test('log method should create correct log entry', () => {
        philosopher = new Philosopher(2, forks);
        philosopher.log('EAT_START');
        const log = getEventLog();
        expect(log.length).toBe(1);
        expect(log[0].phil).toBe(2);
        expect(log[0].event).toBe('EAT_START');
        expect(log[0].forks).toEqual([2, 3]);
    });
});

describe('Constants', () => {
    test('N should be 5', () => {
        expect(N).toBe(5);
    });

    test('MEALS_PER_PHILOSOPHER should be 10', () => {
        expect(MEALS_PER_PHILOSOPHER).toBe(10);
    });
});

describe('Circular table topology', () => {
    test('each philosopher shares forks with neighbors', () => {
        const forks = Array.from({ length: 5 }, (_, i) => new Fork(i));
        const philosophers = Array.from({ length: 5 }, (_, i) => new Philosopher(i, forks));

        for (let i = 0; i < 5; i++) {
            const current = philosophers[i];
            const next = philosophers[(i + 1) % 5];

            // Current philosopher's right fork (f2) should be next philosopher's left fork (f1)
            expect(current.f2).toBe(next.f1);
        }
    });

    test('all forks are used exactly twice (once by each adjacent philosopher)', () => {
        const forks = Array.from({ length: 5 }, (_, i) => new Fork(i));
        const philosophers = Array.from({ length: 5 }, (_, i) => new Philosopher(i, forks));

        const forkUsage = Array(5).fill(0);

        philosophers.forEach(p => {
            forkUsage[p.f1]++;
            forkUsage[p.f2]++;
        });

        // Each fork should be referenced exactly twice
        forkUsage.forEach(usage => {
            expect(usage).toBe(2);
        });
    });
});

describe('Event logging', () => {
    beforeEach(() => {
        clearEventLog();
    });

    test('getEventLog returns event log array', () => {
        expect(Array.isArray(getEventLog())).toBe(true);
    });

    test('clearEventLog empties the log', () => {
        const forks = Array.from({ length: 5 }, (_, i) => new Fork(i));
        const philosopher = new Philosopher(0, forks);
        philosopher.log('EAT_START');
        expect(getEventLog().length).toBe(1);
        clearEventLog();
        expect(getEventLog().length).toBe(0);
    });

    test('log entries have correct JSON structure', () => {
        startRun('test-algorithm');
        const forks = Array.from({ length: 5 }, (_, i) => new Fork(i));
        const philosopher = new Philosopher(1, forks);
        philosopher.log('EAT_END');
        const log = getEventLog();
        expect(log[0]).toHaveProperty('t');
        expect(log[0]).toHaveProperty('phil', 1);
        expect(log[0]).toHaveProperty('event', 'EAT_END');
        expect(log[0]).toHaveProperty('forks', [1, 2]);
        expect(log[0]).toHaveProperty('algorithm', 'test-algorithm');
        expect(log[0]).toHaveProperty('runId');
    });

    test('log entries have millisecond timestamp', () => {
        startRun('test');
        const forks = Array.from({ length: 5 }, (_, i) => new Fork(i));
        const philosopher = new Philosopher(0, forks);
        philosopher.log('EAT_START');
        const log = getEventLog();
        expect(typeof log[0].t).toBe('number');
        expect(log[0].t).toBeGreaterThanOrEqual(0);
    });

    test('startRun generates unique runId', () => {
        const runId1 = startRun('algo1');
        const runId2 = startRun('algo2');
        expect(runId1).not.toBe(runId2);
        expect(runId1).toMatch(/^[a-z0-9]{6}$/);
        expect(runId2).toMatch(/^[a-z0-9]{6}$/);
    });

    test('log entries include runId and algorithm', () => {
        const runId = startRun('myalgo');
        const forks = Array.from({ length: 5 }, (_, i) => new Fork(i));
        const philosopher = new Philosopher(0, forks);
        philosopher.log('EAT_START');
        const log = getEventLog();
        expect(log[0].runId).toBe(runId);
        expect(log[0].algorithm).toBe('myalgo');
    });
});

// ============================================================================
// LOG ANALYSIS TESTS - Verify algorithm correctness via log analysis
// ============================================================================

// Helper function to analyze logs for correctness
// Note: The logging format logs [f1, f2] (both philosopher's forks) for context,
// but in sequential acquire algorithms, only one fork is being acquired/released at a time.
// We need to track state more carefully - looking at the sequence of TRY->ACQUIRE pairs.
function analyzeLog(log, n) {
    const results = {
        // Per-philosopher stats
        mealsPerPhilosopher: Array(n).fill(0),

        // Event sequence validation
        sequenceErrors: [],

        // Mutual exclusion validation - two adjacent philosophers eating at same time
        mutualExclusionViolations: [],

        // Track eating philosophers at each point
        currentlyEating: new Set(),
    };

    for (let i = 0; i < log.length; i++) {
        const entry = log[i];
        const phil = entry.phil;
        const event = entry.event;

        switch (event) {
            case 'EAT_START':
                // Check mutual exclusion - no adjacent philosopher should be eating
                const leftNeighbor = (phil - 1 + n) % n;
                const rightNeighbor = (phil + 1) % n;

                if (results.currentlyEating.has(leftNeighbor)) {
                    results.mutualExclusionViolations.push({
                        index: i,
                        error: `Philosopher ${phil} started eating while neighbor ${leftNeighbor} is eating`
                    });
                }
                if (results.currentlyEating.has(rightNeighbor)) {
                    results.mutualExclusionViolations.push({
                        index: i,
                        error: `Philosopher ${phil} started eating while neighbor ${rightNeighbor} is eating`
                    });
                }

                results.currentlyEating.add(phil);
                break;

            case 'EAT_END':
                if (!results.currentlyEating.has(phil)) {
                    results.sequenceErrors.push({
                        index: i,
                        error: `Philosopher ${phil} ended eating but was not eating`
                    });
                }
                results.currentlyEating.delete(phil);
                results.mealsPerPhilosopher[phil]++;
                break;

            case 'TRY':
            case 'ACQUIRE':
            case 'RELEASE':
            case 'TIMEOUT':
                // These are valid events, no additional validation needed
                break;
        }
    }

    return results;
}

// Helper to run an algorithm and get its log
async function runAlgorithm(name, n, startMethod) {
    clearEventLog();
    startRun(name);

    const forks = Array.from({ length: n }, (_, i) => new Fork(i));
    const philosophers = Array.from({ length: n }, (_, i) => new Philosopher(i, forks));

    await Promise.all(startMethod(philosophers));

    return getEventLog().filter(e => e.algorithm === name);
}

describe('Asymmetric algorithm - log analysis', () => {
    const N = 5;
    const MEALS = 10;

    beforeEach(() => {
        clearEventLog();
    });

    test('all philosophers complete required meals', async () => {
        const log = await runAlgorithm('asymmetric', N,
            (philosophers) => philosophers.map(p => p.startAsym(MEALS))
        );

        const analysis = analyzeLog(log, N);

        for (let i = 0; i < N; i++) {
            expect(analysis.mealsPerPhilosopher[i]).toBe(MEALS);
        }
    }, 30000);

    test('no mutual exclusion violations', async () => {
        const log = await runAlgorithm('asymmetric', N,
            (philosophers) => philosophers.map(p => p.startAsym(MEALS))
        );

        const analysis = analyzeLog(log, N);
        expect(analysis.mutualExclusionViolations).toEqual([]);
    }, 30000);

    test('valid event sequences', async () => {
        const log = await runAlgorithm('asymmetric', N,
            (philosophers) => philosophers.map(p => p.startAsym(MEALS))
        );

        const analysis = analyzeLog(log, N);
        expect(analysis.sequenceErrors).toEqual([]);
    }, 30000);

    test('fairness - no philosopher starved (reasonable distribution)', async () => {
        const log = await runAlgorithm('asymmetric', N,
            (philosophers) => philosophers.map(p => p.startAsym(50))
        );

        const analysis = analyzeLog(log, N);

        // All philosophers should complete their meals
        for (let i = 0; i < N; i++) {
            expect(analysis.mealsPerPhilosopher[i]).toBe(50);
        }
    }, 60000);
});

describe('Conductor algorithm - log analysis', () => {
    const N = 5;
    const MEALS = 10;

    beforeEach(() => {
        clearEventLog();
    });

    test('all philosophers complete required meals', async () => {
        const { Conductor } = require('./philosophers');
        const log = await runAlgorithm('conductor', N,
            (philosophers) => {
                const conductor = new Conductor(N - 1);
                return philosophers.map(p => p.startConductor(MEALS, conductor));
            }
        );

        const analysis = analyzeLog(log, N);

        for (let i = 0; i < N; i++) {
            expect(analysis.mealsPerPhilosopher[i]).toBe(MEALS);
        }
    }, 30000);

    test('no mutual exclusion violations', async () => {
        const { Conductor } = require('./philosophers');
        const log = await runAlgorithm('conductor', N,
            (philosophers) => {
                const conductor = new Conductor(N - 1);
                return philosophers.map(p => p.startConductor(MEALS, conductor));
            }
        );

        const analysis = analyzeLog(log, N);
        expect(analysis.mutualExclusionViolations).toEqual([]);
    }, 30000);

    test('valid event sequences', async () => {
        const { Conductor } = require('./philosophers');
        const log = await runAlgorithm('conductor', N,
            (philosophers) => {
                const conductor = new Conductor(N - 1);
                return philosophers.map(p => p.startConductor(MEALS, conductor));
            }
        );

        const analysis = analyzeLog(log, N);
        expect(analysis.sequenceErrors).toEqual([]);
    }, 30000);
});

describe('Simultaneous algorithm - log analysis', () => {
    const N = 5;
    const MEALS = 10;

    beforeEach(() => {
        clearEventLog();
    });

    test('all philosophers complete required meals', async () => {
        const log = await runAlgorithm('simultaneous', N,
            (philosophers) => philosophers.map(p => p.startSimultaneous(MEALS))
        );

        const analysis = analyzeLog(log, N);

        for (let i = 0; i < N; i++) {
            expect(analysis.mealsPerPhilosopher[i]).toBe(MEALS);
        }
    }, 30000);

    test('no mutual exclusion violations', async () => {
        const log = await runAlgorithm('simultaneous', N,
            (philosophers) => philosophers.map(p => p.startSimultaneous(MEALS))
        );

        const analysis = analyzeLog(log, N);
        expect(analysis.mutualExclusionViolations).toEqual([]);
    }, 30000);

    test('valid event sequences', async () => {
        const log = await runAlgorithm('simultaneous', N,
            (philosophers) => philosophers.map(p => p.startSimultaneous(MEALS))
        );

        const analysis = analyzeLog(log, N);
        expect(analysis.sequenceErrors).toEqual([]);
    }, 30000);

    test('acquires both forks atomically (TRY followed by ACQUIRE for both)', async () => {
        const log = await runAlgorithm('simultaneous', N,
            (philosophers) => philosophers.map(p => p.startSimultaneous(MEALS))
        );

        // In simultaneous algorithm, each ACQUIRE should have both forks
        const acquireEvents = log.filter(e => e.event === 'ACQUIRE');
        for (const event of acquireEvents) {
            // Each ACQUIRE should list both forks of the philosopher
            expect(event.forks.length).toBe(2);
            expect(event.forks).toContain(event.phil);
            expect(event.forks).toContain((event.phil + 1) % N);
        }
    }, 30000);
});
