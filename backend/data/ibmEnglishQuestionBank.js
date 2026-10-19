// Original AptitudePro English-language practice items; not official IBM questions.
module.exports = [
  ['Grammar', 'Neither the analyst nor the developers ___ available for the review.', ['was', 'were', 'is', 'has been'], 1, 'With neither...nor, the verb agrees with the nearer subject. “Developers” is plural, so use “were.”'],
  ['Active and passive voice', 'Choose the correct passive form: “The team completed the migration yesterday.”', ['The migration completed the team yesterday.', 'The migration was completed by the team yesterday.', 'The migration is completed by the team yesterday.', 'The migration has completing by the team yesterday.'], 1, 'A past simple active sentence becomes “was/were + past participle” in the passive.'],
  ['Error spotting', 'Which part contains an error? “Each of the reports (A) / have been checked (B) / by the supervisor (C) / before release (D).”', ['A', 'B', 'C', 'D'], 1, '“Each” is singular, so the verb should be “has been checked.”'],
  ['Fill in the blank', 'Please send the revised document ___ noon so the team can review it.', ['by', 'at', 'from', 'during'], 0, '“By noon” sets a deadline no later than noon.'],
  ['Synonyms', 'Choose the word closest in meaning to “concise.”', ['Brief', 'Uncertain', 'Detailed', 'Delayed'], 0, '“Concise” means brief while expressing the necessary information.'],
  ['Antonyms', 'Choose the word opposite in meaning to “expand.”', ['Enlarge', 'Extend', 'Reduce', 'Explain'], 2, '“Reduce” is the opposite of “expand.”'],
  ['Tenses', 'By the time the meeting began, the engineers ___ the main risks.', ['identify', 'have identified', 'had identified', 'will identify'], 2, 'The identification happened before another past event, so past perfect is appropriate.'],
  ['Sentence correction', 'Choose the grammatically correct sentence.', ['The software, along with its updates, are ready.', 'The software, along with its updates, is ready.', 'The software, along with its updates, were ready.', 'The software, along with its updates, have ready.'], 1, 'The main subject “software” is singular; the intervening phrase does not change the verb.'],
  ['Articles', 'The team selected ___ approach that reduced duplicate processing.', ['an', 'a', 'the', 'no article'], 0, '“Approach” begins with a vowel sound; use “an” before it.'],
  ['Conditionals', 'If the server ___ again, the monitoring system will alert the on-call engineer.', ['fails', 'failed', 'will fail', 'would fail'], 0, 'In a first conditional, use present simple in the if-clause and “will” in the result clause.']
].map(([topic, question, options, answerIndex, explanation], i) => ({
  id: `ibm-english-${i + 1}`, topic, question, options, answerIndex, explanation
}));
