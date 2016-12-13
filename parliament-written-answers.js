const Highland = require('highland')
const Request = require('request')
const RetryMe = require('retry-me')
const FS = require('fs')
const CSVWriter = require('csv-write-stream')

const http = Highland.wrapCallback((location, callback) => {
    const wrapper = location => {
        return callbackInner => {
            Request.defaults({ timeout: 30 * 1000 })(location, (error, response) => {
                const failure = error ? error : (response.statusCode >= 400) ? new Error(response.statusCode) : null
                callbackInner(failure, response)
            })
        }
    }
    RetryMe(wrapper(location), { factor: 1.5 }, callback)
})

const location = 'http://lda.data.parliament.uk/answeredquestions.json'

function locate(response) {
    const pages = Math.ceil(JSON.parse(response.body).result.totalResults / 500)
    return Array.from({ length: pages }).map((_, i) => {
        return {
            uri: 'http://lda.data.parliament.uk/answeredquestions.json',
            qs: {
                '_pageSize': 500,
                '_page': i
            }
        }
    })
}

function unwrap(response) {
    const body = JSON.parse(response.body)
    console.log('Parsing page ' + body.result.page + ' of ' + (Math.ceil(body.result.totalResults / 500) - 1) + '...')
    return body.result.items
}

function format(item) {
    if (!item.uin) throw new Error('Item has no UIN:\n' + JSON.stringify(item, null, 2))
    return {
        uin: item.uin,
        legislature: item.legislature[0].prefLabel._value,
        heading: item.hansardHeading ? item.hansardHeading._value : null,
        question: item.questionText,
        questionFromMember: item.tablingMemberPrinted[0]._value,
        questionFromMemberConstituency: item.tablingMemberConstituency ? item.tablingMemberConstituency._value : null,
        questionAskedDate: item.date._value,
        answer: item.answer.answerText._value,
        answerFromBody: item.AnsweringBody[0]._value,
        answerFromMember: item.answer.answeringMemberPrinted._value,
        answerFromMemberConstituency: item.answer.answeringMemberConstituency ? item.answer.answeringMemberConstituency._value : null,
        answerIsMinisteralCorrection: item.answer.isMinisterialCorrection._value === 'true',
        answerGivenDate: item.answer.dateOfAnswer._value,
        answerGivenFirstDate: item.answer.questionFirstAnswered[0]._value,
        registeredInterest: item.registeredInterest._value === 'true' // TODO what
    }
}

Highland([location])
    .flatMap(http)
    .flatMap(locate)
    .flatMap(http)
    .flatMap(unwrap)
    .map(format)
    .errors(e => console.log(e.stack))
    .through(CSVWriter())
    .pipe(FS.createWriteStream('parliament-written-answers.csv'))
