const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect } = require('../middlewares/auth');

// Create post
router.post('/', protect, async (req, res) => {
  const { content } = req.body;

  if (!content) return res.status(400).json({ message: 'Content required' });

  try {
    const post = new Post({ author: req.user._id, content });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get posts with pagination (page & limit query params)
router.get('/', async (req, res) => {
  const page = Number(req.query.page);
  const limit = Number(req.query.limit);

  try {
    let postsQuery = Post.find().sort({ createdAt: -1 }).populate('author', 'username');
    let total = await Post.countDocuments();
    let posts;
    let pages = 1;
    if (limit && page) {
      const skip = (page - 1) * limit;
      posts = await postsQuery.skip(skip).limit(limit);
      pages = Math.ceil(total / limit);
    } else {
      posts = await postsQuery;
    }
    res.json({
      posts,
      page: page || 1,
      pages,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update post
router.put('/:id', protect, async (req, res) => {
  const { content } = req.body;

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Only author can edit
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post.content = content || post.content;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete post
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Only author can delete
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await post.deleteOne();
    res.json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
