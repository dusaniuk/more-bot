import * as faker from 'faker';
import { User as TelegrafUser } from 'telegraf/typings/telegram-types';

import { createMockContext } from '../../../../test/context.mock';

import { AppContext } from '../../../shared/interfaces';
import { Mention } from '../../core/interfaces/catch';
import { User } from '../../core/interfaces/user';

import { ContextParser } from './context-parser';


describe('ContextParser', () => {
  let service: ContextParser;

  let ctx: AppContext;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ContextParser();

    ctx = createMockContext();
  });

  describe('mapToUserEntity', () => {
    it('should create user', () => {
      const telegrafUser: TelegrafUser = {
        id: faker.random.number(),
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        username: faker.internet.userName(),
      } as TelegrafUser;

      const user: User = service.mapToUserEntity(telegrafUser);

      expect(user).toEqual({
        id: telegrafUser.id,
        firstName: telegrafUser.first_name,
        lastName: telegrafUser.last_name,
        username: telegrafUser.username,
      });
    });

    it('should create user without username', () => {
      const telegrafUser = {
        id: faker.random.number(),
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
      } as TelegrafUser;

      const user: User = service.mapToUserEntity(telegrafUser);

      expect(user.username).toBeUndefined();
    });

    it('should create user without last name', () => {
      const telegrafUser: TelegrafUser = {
        id: faker.random.number(),
        first_name: faker.name.firstName(),
        username: faker.internet.userName(),
      } as TelegrafUser;

      const user: User = service.mapToUserEntity(telegrafUser);

      expect(user.lastName).toBeUndefined();
    });
  });

  describe('getMentionedUsers', () => {
    it('should return user mention by username', () => {
      const username = faker.internet.userName();
      ctx.message = {
        ...ctx.message,
        text: `@${username}`,
        entities: [
          { type: 'mention', offset: 0, length: username.length + 1 },
        ],
      };

      const mentions: Mention[] = service.getMentionsFromContext(ctx);

      expect(mentions).toHaveLength(1);
      expect(mentions[0]).toEqual({ username });
    });

    it('should return user id if he is mentioned by text', () => {
      const id = faker.random.number();
      const firstName = faker.name.firstName();

      ctx.message = {
        ...ctx.message,
        text: firstName,
        entities: [{
          offset: 0,
          type: 'text_mention',
          length: firstName.length,
          user: { id, is_bot: false, first_name: firstName },
        }],
      };

      const mentions: Mention[] = service.getMentionsFromContext(ctx);

      expect(mentions).toHaveLength(1);
      expect(mentions[0]).toEqual({ id });
    });

    it('should return mention by username and by id', () => {
      const id = faker.random.number();
      const firstName = faker.name.firstName();
      const username = faker.internet.userName();

      ctx.message = {
        ...ctx.message,
        text: `${firstName} @${username}`,
        entities: [
          {
            offset: 0,
            type: 'text_mention',
            length: firstName.length,
            user: { id, is_bot: false, first_name: firstName },
          }, {
            type: 'mention', offset: firstName.length + 1, length: username.length + 1,
          },
        ],
      };

      const mentions: Mention[] = service.getMentionsFromContext(ctx);

      expect(mentions).toHaveLength(2);
      expect(mentions[0]).toEqual({ id });
      expect(mentions[1]).toEqual({ username });
    });

    it('should return 2 mentions by username', () => {
      const username1 = faker.name.firstName();
      const username2 = faker.internet.userName();

      ctx.message = {
        ...ctx.message,
        text: `@${username1} @${username2}`,
        entities: [
          { type: 'mention', offset: 0, length: username1.length + 1 },
          { type: 'mention', offset: username1.length + 2, length: username2.length + 1 },
        ],
      };

      const mentions: Mention[] = service.getMentionsFromContext(ctx);

      expect(mentions).toHaveLength(2);
      expect(mentions[0]).toEqual({ username: username1 });
      expect(mentions[1]).toEqual({ username: username2 });
    });

    it('should return only one mention if one user was mentioned twice', () => {
      const username = faker.internet.userName();

      ctx.message = {
        ...ctx.message,
        text: `@${username} @${username}`,
        entities: [
          { type: 'mention', offset: 0, length: username.length + 1 },
          { type: 'mention', offset: username.length + 2, length: username.length + 1 },
        ],
      };

      const mentions: Mention[] = service.getMentionsFromContext(ctx);

      expect(mentions).toHaveLength(1);
      expect(mentions[0]).toEqual({ username });
    });

    it('should return an empty array if there are no mentions in entities', () => {
      const email = faker.internet.email();
      const phone = faker.phone.phoneNumber();

      ctx.message = {
        ...ctx.message,
        text: `${email} ${phone}`,
        entities: [
          { offset: 0, type: 'email', length: email.length },
          { offset: email.length + 1, type: 'phone_number', length: phone.length },
        ],
      };

      const mentions: Mention[] = service.getMentionsFromContext(ctx);

      expect(mentions).toHaveLength(0);
    });

    it('should not return anything if message is empty', () => {
      ctx.message = { ...ctx.message, text: '', entities: [] };

      const mentions: Mention[] = service.getMentionsFromContext(ctx);

      expect(mentions).toHaveLength(0);
    });

    it('should not return anything if entities array are not provided', () => {
      const mentions: Mention[] = service.getMentionsFromContext(ctx);

      expect(mentions).toHaveLength(0);
    });
  });
});
