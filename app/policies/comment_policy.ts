import type User from '#models/user'
import type Comment from '#models/comment'
import { BasePolicy } from '@adonisjs/bouncer'

export default class CommentPolicy extends BasePolicy {
  /**
   * Only the comment owner can delete their comment
   */
  delete(user: User, comment: Comment) {
    return user.id === comment.userId
  }
}
