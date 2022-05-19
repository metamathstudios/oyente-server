const helpers = require('./helpers/promise-checker')
const eventFilter = require('../src/moonbase-event-filter')

describe('Oyente: Blockchain Events Sync', () => {

    beforeEach(() => {
  
    })
  
    it('Blockchain agent is connected', async () => {
      expect(helpers.isPromise(eventFilter.getBlock())).toBe(true)
    })
  
    it('Blockchain agent is able to get current block', async () => {
        const block = await eventFilter.getBlock()
  
        expect(typeof block).toBe('number')
    })
  
    it('Event filters are avaiable', async () => {
        const filter = await eventFilter.getSwapsFilter()
  
        expect(filter.hasOwnProperty('address')).toBe(true)
        expect(filter.hasOwnProperty('topics')).toBe(true)
    })
  
  })