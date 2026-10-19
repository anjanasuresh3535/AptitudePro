// Original AptitudePro passages and server-side answer keys for the listening
// practice session. The transcript and answer key stay on the server; only the
// generated audio URL, question prompts, and options are sent before submission.
const LISTENING_PASSAGES = [
    {
        id: 'library-pilot',
        title: 'The mobile library pilot',
        audioUrl: '/audio/capgemini/listening-library.wav',
        transcript: 'Harbor Street Library began its mobile lending pilot in April. For eight weeks, a van visited three neighborhood stops every Tuesday and Thursday. The first stop opened at nine in the morning near the market; the final stop ended at four beside the community center. The van carried popular novels, children’s books, and a small collection of large-print titles. Staff expected the market to be busiest, but the community center received the most requests, averaging eighteen books per visit. In response, the library plans to add more children’s titles at the center and move the first stop by thirty minutes to avoid school drop-off traffic. The pilot will be reviewed in June before the library decides whether to add Saturday service.',
        questions: [
            { id: 'lib-duration', prompt: 'How long was the mobile lending pilot scheduled to run?', options: { A: 'Four weeks', B: 'Eight weeks', C: 'Three months', D: 'One year' }, correct: 'B', explanation: 'The passage says the van visited the stops for eight weeks.' },
            { id: 'lib-requests', prompt: 'Which stop received the most book requests?', options: { A: 'The market', B: 'The library entrance', C: 'The community center', D: 'The school' }, correct: 'C', explanation: 'The community center averaged eighteen book requests per visit, the highest of the stops.' },
            { id: 'lib-schedule', prompt: 'Why will the first stop start thirty minutes later?', options: { A: 'To avoid school drop-off traffic', B: 'To give staff more time to sort books', C: 'To match the market opening time', D: 'To add a Saturday visit' }, correct: 'A', explanation: 'The library plans the change to avoid school drop-off traffic.' }
        ]
    },
    {
        id: 'office-energy',
        title: 'An office energy review',
        audioUrl: '/audio/capgemini/listening-energy.wav',
        transcript: 'In September, the Greenline office energy team checked electricity use across five floors. It replaced hallway lights with LEDs. After one month, energy used for hallway lighting fell by eighteen percent compared with the previous month. Overall building use dropped by only six percent because two floors kept ventilation running after staff left. The team did not recommend switching ventilation off, because server equipment needs airflow overnight. Instead, the facilities manager will test a schedule that lowers ventilation on meeting-room floors while keeping the server room at its required settings. Results will be compared next quarter. Employees are also asked to turn off desk monitors before leaving. The team will wait for a full season of data before changing the thermostat.',
        questions: [
            { id: 'energy-lights', prompt: 'By how much did hallway lighting energy use fall?', options: { A: 'Six percent', B: 'Twelve percent', C: 'Eighteen percent', D: 'Twenty-five percent' }, correct: 'C', explanation: 'Hallway lighting energy fell by eighteen percent.' },
            { id: 'energy-reason', prompt: 'Why did overall building use fall less than hallway lighting use?', options: { A: 'The LED lights used more power', B: 'Ventilation continued running on two floors after hours', C: 'The office added another floor', D: 'Employees used desk monitors overnight' }, correct: 'B', explanation: 'Ventilation kept running after staff left on two floors.' },
            { id: 'energy-server', prompt: 'Why will the server room keep its current ventilation settings?', options: { A: 'It is the warmest room', B: 'It has no windows', C: 'The equipment requires overnight airflow', D: 'The team has no access to the room' }, correct: 'C', explanation: 'The passage says server equipment needs airflow overnight.' }
        ]
    },
    {
        id: 'transit-survey',
        title: 'A transit rider survey',
        audioUrl: '/audio/capgemini/listening-transit.wav',
        transcript: 'In May, the municipal transit agency surveyed two hundred and forty riders across six bus routes. Sixty percent said they usually travel before nine in the morning. The most frequent request was for real-time arrival information, rather than additional routes. The agency plans to pilot electronic display boards at the central station and test app notifications in July. It will evaluate the pilot by tracking missed connections and collecting rider feedback. The team said that counting app downloads alone would not show whether the change helped people. If the pilot improves journey planning, the agency may extend the displays to two busy interchanges later in the year.',
        questions: [
            { id: 'transit-sample', prompt: 'How many riders took part in the survey?', options: { A: '60', B: '145', C: '200', D: '240' }, correct: 'D', explanation: 'The agency surveyed two hundred and forty riders.' },
            { id: 'transit-request', prompt: 'What was the most frequent rider request?', options: { A: 'More bus routes', B: 'Lower fares', C: 'Real-time arrival information', D: 'Later morning service' }, correct: 'C', explanation: 'Riders most often requested real-time arrival information.' },
            { id: 'transit-measure', prompt: 'How will the agency evaluate whether the pilot helps riders?', options: { A: 'By counting app downloads only', B: 'By tracking missed connections and collecting feedback', C: 'By reducing the number of routes', D: 'By comparing ticket prices' }, correct: 'B', explanation: 'The agency will track missed connections and collect rider feedback; downloads alone are not enough.' }
        ]
    }
];

module.exports = { LISTENING_PASSAGES };
