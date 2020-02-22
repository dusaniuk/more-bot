import { User as TelegrafUser } from 'telegraf/typings/telegram-types';
import { inject, injectable } from 'inversify';

import { AppContext } from '../../../shared/interfaces';
import { TYPES } from '../../types';

import { ChatType } from '../constants/chat-type';
import { User, Score } from '../../core/interfaces/user';
import { ActionResult } from '../../core/models/action-result';
import { AlreadyInGameError, NotInGameError } from '../../core/errors';
import { IScoreController, IUsersController } from '../../core/interfaces/controllers';

import { getGreetingNameForUser, getUsersScore } from '../utils/helpers';
import { ContextParser } from '../services';


@injectable()
export class UsersHandler {
  constructor(
    @inject(TYPES.CONTEXT_PARSER) private parser: ContextParser,
    @inject(TYPES.USERS_CONTROLLER) private usersController: IUsersController,
    @inject(TYPES.SCORE_CONTROLLER) private scoreController: IScoreController,
  ) {}

  register = async (ctx: AppContext): Promise<any> => {
    if (ctx.chat.type === ChatType.private) {
      return ctx.reply(ctx.i18n.t('error.rejectPrivate'));
    }

    const user: User = this.parser.mapToUserEntity(ctx.from);
    const result: ActionResult = await this.usersController.addUserToGame(ctx.chat.id, user);

    if (result?.error instanceof AlreadyInGameError) {
      return ctx.reply(ctx.i18n.t('error.alreadyInGame'));
    }

    return ctx.reply(
      ctx.i18n.t('user.greetNew', {
        user: getGreetingNameForUser(user),
      }),
    );
  };

  update = async (ctx: AppContext): Promise<any> => {
    const { from, chat }: AppContext = ctx;

    const result: ActionResult = await this.usersController.updateUserDataInChat(chat.id, from.id, {
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name ?? null,
    });

    if (result?.error instanceof NotInGameError) {
      return ctx.reply(ctx.i18n.t('error.notInGame'));
    }

    return ctx.reply(ctx.i18n.t('user.successUpdate'));
  };

  getScore = async (ctx: AppContext): Promise<any> => {
    const result: ActionResult<Score> = await this.scoreController.getSortedScoreForChat(ctx.chat.id);

    if (result.ok) {
      await ctx.reply(
        ctx.i18n.t('user.score', {
          score: getUsersScore(result.payload),
        }),
      );
    }
  };

  onNewMemberInChat = async (ctx: AppContext): Promise<void> => {
    const newMembers: User[] = this.getNewMembers(ctx);

    for (const user of newMembers) {
      const result: ActionResult = await this.usersController.isUserInGame(ctx.chat.id, user.id);

      if (result.ok) {
        await ctx.reply(ctx.i18n.t('user.welcomeBack'));
      } else {
        await this.usersController.addUserToGame(ctx.chat.id, user);
      }
    }
  };

  onLeftChatMember = async (ctx: AppContext): Promise<any> => {
    const leftMember = this.parser.mapToUserEntity(ctx.message.left_chat_member);

    await ctx.reply(ctx.i18n.t('user.onLeft', {
      user: getGreetingNameForUser(leftMember),
    }));
  };

  private getNewMembers = (ctx: AppContext): User[] => {
    const newUsers: TelegrafUser[] = (ctx.message?.new_chat_members ?? []).filter((user) => !user.is_bot);
    return newUsers.map(this.parser.mapToUserEntity);
  };
}