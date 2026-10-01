import type { HttpContext } from '@adonisjs/core/http'
import Comment from '#models/comment'
import { createCommentValidator } from '#validators/comment'
import CommentPolicy from '#policies/comment_policy'

export default class CommentsController {
  /**
   * Handle the form submission for creating a new comment
   */
  async store({ request, auth, params, response }: HttpContext) {
    // Validate the comment content
    const payload = await request.validateUsing(createCommentValidator)

    // Create the comment and associate it with the post and user
    await Comment.create({
      ...payload,
      postId: params.id,
      userId: auth.user!.id,
    })

    // Redirect back to the post page
    return response.redirect().back()
  }
  /**
   * Delete a comment
   */
  async destroy({ bouncer, params, response, session }: HttpContext) {
    const comment = await Comment.findOrFail(params.id)

    // Load the post so we can redirect back to it
    await comment.load('post')

    // Check if the user can delete this comment
    await bouncer.with(CommentPolicy).authorize('delete', comment)

    await comment.delete()

    session.flash('success', 'Comment deleted successfully')
    return response.redirect().toRoute('posts.show', { id: comment.post.id })
  }
}
