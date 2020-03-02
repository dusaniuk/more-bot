import { inject, injectable } from 'inversify';

import { AppContext } from '../../../shared/interfaces';
import { TYPES } from '../../types';

import { ICatchController } from '../../core/interfaces/controllers';
import { CatchResultContextData, CatchResult } from '../../core/interfaces/catch';

import { ContextParser } from '../services';
import { BaseActionHandler } from './base/base-action-handler';


@injectable()
export class ApproveCatchHandler extends BaseActionHandler {
  constructor(
    @inject(TYPES.CONTEXT_PARSER) private parser: ContextParser,
    @inject(TYPES.CATCH_CONTROLLER) private catchController: ICatchController,
  ) {
    super();
  }

  protected handleAction = async (ctx: AppContext): Promise<void> => {
    const { catchId, chatId } = this.getCatchResultData(ctx);

    await this.approveCatch(catchId, chatId);
  };

  private getCatchResultData = (ctx: AppContext): CatchResultContextData => {
    const [, catchId, chatId] = ctx.callbackQuery.data.split(' ');

    return {
      chatId: +chatId,
      catchId,
    };
  };

  private approveCatch = async (catchId: string, chatId: number): Promise<void> => {
    await this.replyService.deleteMessageFromAdminChat();

    const catchResult: CatchResult = await this.catchController.approveCatch(chatId, catchId);

    await this.replyService.sayAboutSucceededCatch(
      chatId,
      catchResult.hunter,
      catchResult.earnedPoints,
    );

    await this.replyService.notifyAdminAboutHandledCatch();
  };
}
