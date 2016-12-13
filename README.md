Scrape Parliament Written Answers
=================================

"[Written questions] (http://www.parliament.uk/business/publications/written-questions-answers-statements/written-questions-answers/) allow Members of Parliament to ask government ministers for information on the work, policy and activities of government departments."

This uses the Parliament [Written Answers to Written Questions API] (http://www.data.parliament.uk/dataset/02) to pull all the available records into a CSV file.

Requires [Node] (http://nodejs.org/).

Install the dependencies with `npm install`, then run `node parliament-written-answers`. Produces a file named `parliament-written-answers.csv`.
