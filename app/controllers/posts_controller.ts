import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'
import { createPostValidator, updatePostValidator } from '#validators/post'
import PostPolicy from '#policies/post_policy'

export default class PostsController {
  async index({ view }: HttpContext) {
    const posts = await Post.query().preload('user').orderBy('createdAt', 'desc')

    return view.render('posts/index', { posts })
  }

  async show({ params, view }: HttpContext) {
    const post = await Post.query()
      .where('id', params.id)
      .preload('user')
      .preload('comments', (query) => {
        query.preload('user').orderBy('createdAt', 'asc')
      })
      .firstOrFail()

    return view.render('posts/show', { post })
  }

  /**
   * Display the form for creating a new post
   */
  async create({ view }: HttpContext) {
    return view.render('posts/create')
  }

  /**
   * Handle the form submission for creating a new post
   */
  async store({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(createPostValidator)

    await Post.create({
      ...payload,
      userId: auth.user!.id,
    })

    return response.redirect().toRoute('posts.index')
  }

  /**
   * Show the edit form
   */
  async edit({ bouncer, params, view }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    // Check if the current user can edit this post
    await bouncer.with(PostPolicy).authorize('edit', post)

    return view.render('posts/edit', { post })
  }
  async update({ bouncer, params, request, response, session }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    // Check authorization again. Someone could send a PUT request directly
    await bouncer.with(PostPolicy).authorize('edit', post)

    // Validate and update the post
    const data = await request.validateUsing(updatePostValidator)
    await post.merge(data).save()

    session.flash('success', 'Post updated successfully')
    return response.redirect().toRoute('posts.show', { id: post.id })
  }
  /**
   * Delete a post
   */
  async destroy({ bouncer, params, response, session }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    // Check if the user can delete this post
    await bouncer.with(PostPolicy).authorize('delete', post)

    await post.delete()

    session.flash('success', 'Post deleted successfully')
    return response.redirect().toRoute('posts.index')
  }
}
