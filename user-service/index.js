const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3001;

app.use(express.json());


app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

 

// "mongo" is docker-compose service name for MongoDB, and 27017 is the default MongoDB port
mongoose.connect('mongodb://mongo:27017/user-service').then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

const UserSchema = new mongoose.Schema({
    name: String,
    email: String
});
const User = mongoose.model('User', UserSchema);


app.post('/users', async (req, res) => {        
    const { name, email } = req.body;
    const user = new User({ name, email });

    try {
        await user.save();
        console.log('IN POST /users : Users saved Id : ', user._id);
        res.status(201).json(user);
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({ error: 'Failed to save user' });
    }    
});


app.get('/users', async (req, res) => {
    //example: http://localhost:3001/users?email=john@example.com
    const email = req.query.email; 
    if (email) {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log('IN GET /users : User retrieved:', user);
        return res.json(user);
    }

    const users = await User.find();
    console.log('IN GET /users : Users retrieved:', users.length);
    res.json(users);
    
});

app.get('/users/id/:id', async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    console.log('IN GET /users/:id : User retrieved:', user);
    res.json(user);
});

app.get('/users/email/:email', async (req, res) => {
    const user = await User.findOne({ email: req.params.email });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    console.log('IN GET /users/:email : User retrieved:', user);
    res.json(user);
});

app.put('/users/:id', async (req, res) => {
    const { name, email } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { name, email }, 
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('IN PUT /users/:id : User updated:', user);
        res.json(user);

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.delete('/users/id/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);   

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('IN DELETE /users/:id : User deleted:', user);
        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }   
});    

app.delete('/users/email/:email', async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ email: req.params.email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('IN DELETE /users/:email : User deleted:', user);
        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});



app.get('/', (req, res) => {
    res.send('Hello, From User Service ! 😎');
});

app.listen(port, () => {
    console.log(`User service is running on http://localhost:${port}`);
}); 

