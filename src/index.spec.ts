import { expect } from 'chai'
import { getToken } from './index'

describe('index test', () => {
    describe('sayHello function', () => {
        it('should say Hello guys!', () => {
            const token = getToken();
            typeof expect(token).to.be.a("string")
        })
    })
});
