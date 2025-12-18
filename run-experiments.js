// Run experiments for all algorithms and collect logs
//
// Usage:
//   node run-experiments.js [algorithm] [meals] [--solutions]
//
// Arguments:
//   algorithm   - Optional: asymmetric, conductor, simultaneous, naive-timeout, or all (default: all)
//   meals       - Optional: number of meals per philosopher (default: 100)
//   --solutions - Optional: use reference solutions instead of student implementations
//
// Examples:
//   node run-experiments.js                      - run all student implementations with 100 meals
//   node run-experiments.js asymmetric           - run only asymmetric algorithm with 100 meals
//   node run-experiments.js asymmetric 50        - run asymmetric with 50 meals
//   node run-experiments.js conductor --solutions - run conductor with reference solution
//   node run-experiments.js all 1000 --solutions  - run all algorithms with 1000 meals using solutions

const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2).filter(arg => arg !== '--solutions');
const useSolutions = process.argv.includes('--solutions');

const validAlgorithms = ['asymmetric', 'conductor', 'simultaneous', 'naive-timeout', 'all'];
let algorithmArg = args.find(arg => validAlgorithms.includes(arg));
const mealsArg = args.find(arg => /^\d+$/.test(arg));

const selectedAlgorithms = algorithmArg === 'all' || !algorithmArg ?
    (useSolutions ? ['asymmetric', 'conductor', 'simultaneous', 'naive-timeout'] : ['asymmetric', 'conductor', 'simultaneous']) :
    [algorithmArg];

const MEALS = mealsArg ? parseInt(mealsArg, 10) : 100;
const N = 5;

console.log(`Loading implementations from: ${useSolutions ? './solutions' : './philosophers'}`);
console.log(`Running algorithms: ${selectedAlgorithms.join(', ')}`);
console.log(`Running with ${MEALS} meals per philosopher`);

const { Fork, Philosopher, Conductor: StudentConductor, getEventLog, clearEventLog, startRun } = require('./philosophers');

// Load reference solutions if requested (overrides methods on Philosopher prototype)
let Conductor = StudentConductor;
if (useSolutions) {
    const solutions = require('./solutions');
    Conductor = solutions.Conductor;
}

// Helper function to run an experiment
async function runExperiment(name, n, mealsPerPhilosopher, startMethod) {
    const runId = startRun(name);

    const forks = Array.from({ length: n }, (_, i) => new Fork(i));
    const philosophers = Array.from({ length: n }, (_, i) => new Philosopher(i, forks));

    console.log(`\n=== Running ${name} (N=${n}, meals=${mealsPerPhilosopher}) ===\n`);

    await Promise.all(startMethod(philosophers, forks, mealsPerPhilosopher));

    return {
        runId,
        name,
        n,
        mealsPerPhilosopher,
        log: [...getEventLog()]
    };
}

async function main() {
    const results = [];

    clearEventLog();

    // Define all available experiments
    const experiments = {
        'asymmetric': (philosophers, _forks, meals) => philosophers.map(p => p.startAsym(meals)),
        'conductor': (philosophers, _forks, meals) => {
            const conductor = new Conductor(N - 1);
            return philosophers.map(p => p.startConductor(meals, conductor));
        },
        'simultaneous': (philosophers, _forks, meals) => philosophers.map(p => p.startSimultaneous(meals)),
        'naive-timeout': (philosophers, _forks, meals) => philosophers.map(p => p.startNaiveTimeout(meals, null, 10))
    };

    // Run selected experiments
    for (const algorithm of selectedAlgorithms) {
        if (experiments[algorithm]) {
            results.push(await runExperiment(algorithm, N, MEALS, experiments[algorithm]));
        }
    }

    // Save logs
    fs.mkdirSync('logs', { recursive: true });

    const allLogs = getEventLog();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = useSolutions ? '-solutions' : '-student';
    const combinedFilename = `logs/all-experiments${suffix}-${timestamp}.jsonl`;
    fs.writeFileSync(combinedFilename, allLogs.map(e => JSON.stringify(e)).join('\n'));
    console.log(`\nSaved ${allLogs.length} total events to ${combinedFilename}`);

    for (const result of results) {
        const filename = `logs/${result.name}-n${result.n}-m${result.mealsPerPhilosopher}.jsonl`;
        fs.writeFileSync(filename, result.log.map(e => JSON.stringify(e)).join('\n'));
        console.log(`Saved ${result.log.length} events to ${filename}`);
    }

    console.log('\n=== Experiment Summary ===');
    for (const result of results) {
        console.log(`  ${result.name}: runId=${result.runId}, events=${result.log.length}`);
    }
    console.log('\n=== All experiments completed ===\n');
}

main().catch(console.error);
