const blogsRouter = require('express').Router()
const mongoose = require('mongoose')
const Blog = require('../models/blogs')
const User = require('../models/users')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user',{blogs: 0})

    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {

  const blog = await Blog.findById(request.params.id)

  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }

})

blogsRouter.delete('/:id', async (request, response) => {

  const errorMessage = 'Sorry, you are not permitted to delete this blog.'
  if (!request.user) return response.status(401).json({error: errorMessage})

  const blog = await Blog.findById(request.params.id)

  if (!blog) return response.status(404).json({error: 'Blog not found'})

  if (blog.user.toString() === request.user) {
    await Blog.findByIdAndDelete(request.params.id)
  } else {
    return response.status(401).json({error: errorMessage})
  }

  response.status(204).end()
})

blogsRouter.post('/', async (request, response) => {
  // console.log('make blog ',request.user)

  if (!request.user) return response.status(401).json({error: 'Invalid token'})

  const user = await User.findById(request.user)

  const keys = Object.keys(request.body)

  if (!keys.includes('likes')) {
    // console.log('nolikes :( ')
    request.body.likes = 0
  }

  if (!keys.includes('title')) return response.status(400).send({ error: `missing title` })

  if (!keys.includes('url')) return response.status(400).send({ error: `missing url` })

  const blog = new Blog({
    title:  request.body.title,
    author: request.body.author,
    url:    request.body.url,
    likes:  request.body.likes,
    user:   request.user
  })

  // console.log('new blog - ',blog)

  const savedBlog = await blog.save()
  // console.log('user blogs = ',user.blogs,savedBlog._id)
  user.blogs = user.blogs.concat(savedBlog._id)  
  await user.save()
  response.status(201).json(savedBlog)
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }

  const updatedBlog = await Blog.findByIdAndUpdate(new mongoose.Types.ObjectId(request.params.id), blog, { new: true })

  response.status(200).json(updatedBlog)

})

module.exports = blogsRouter