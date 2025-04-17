const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const flash = require('connect-flash');
const app = express();
const port = 3000;

// Mongoose connection and setup
mongoose.connect('mongodb://localhost:27017/biocharDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define schema for farm data
const farmDataSchema = new mongoose.Schema({
  biocharProduced: Number,
  sales: Number,
  soilApplication: Number,
  soilOrganicCarbon: Number,
  applicationDate: Date,
  latitude: Number,
  longitude: Number,
  userId: mongoose.Schema.Types.ObjectId  // Reference to the User
});

const FarmData = mongoose.model('FarmData', farmDataSchema);

// Define user schema for authentication
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  phone: String,
  county: String,
  farmName: String,
  isAdmin: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'biocharSecret',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());  // For flash messages
app.use(express.static(path.join(__dirname, 'public')));

// Passport Local Strategy
passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({ username: username }, (err, user) => {
    if (err) return done(err);
    if (!user) return done(null, false, { message: 'No user found' });
    if (!user.isApproved) return done(null, false, { message: 'User not approved yet' });
    bcrypt.compare(password, user.password, (err, res) => {
      if (res) return done(null, user);
      else return done(null, false, { message: 'Incorrect password' });
    });
  });
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Route to display farm data entry form
app.get('/farm-data', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login.html');
  }
  res.sendFile(__dirname + '/public/farm_data.html');
});

// Route to handle form submission
app.post('/submit-farm-data', (req, res) => {
  const { biocharProduced, sales, soilApplication, soilOrganicCarbon, applicationDate, latitude, longitude } = req.body;

  if (!req.isAuthenticated()) {
    return res.status(401).send('You need to log in to submit farm data');
  }

  const newFarmData = new FarmData({
    biocharProduced,
    sales,
    soilApplication,
    soilOrganicCarbon,
    applicationDate,
    latitude,
    longitude,
    userId: req.user._id
  });

  newFarmData.save((err) => {
    if (err) {
      return res.send("Error saving farm data: " + err);
    }
    res.send('Farm data submitted successfully');
  });
});

// Admin route to get user data for approval
app.get('/admin/users', (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).send('Access denied');
  }
  User.find({ isApproved: false }, (err, users) => {
    if (err) return res.send('Error fetching users');
    res.json(users);
  });
});

// Admin route to approve a user
app.post('/admin/approve-user/:userId', (req, res) => {
  const userId = req.params.userId;
  User.findByIdAndUpdate(userId, { isApproved: true }, (err) => {
    if (err) return res.send('Error approving user');
    res.send('User approved');
  });
});

// Admin route to view all farm data
app.get('/admin/farm-data', (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).send('Access denied');
  }
  FarmData.find({}).populate('userId').exec((err, farmData) => {
    if (err) return res.send('Error fetching farm data');
    res.json(farmData);
  });
});

// User registration route
app.post('/register', async (req, res) => {
  const { username, password, email, phone, county, farmName } = req.body;
  const existingUser = await User.findOne({ username });
  if (existingUser) return res.send('Username already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    username,
    password: hashedPassword,
    email,
    phone,
    county,
    farmName,
    isAdmin: false,
    isApproved: false
  });

  newUser.save((err) => {
    if (err) return res.send('Error registering user');
    res.send('Registration successful. Please wait for admin approval.');
  });
});

// User authentication routes
app.post('/login', passport.authenticate('local', {
  successRedirect: '/farm-data',
  failureRedirect: '/login.html',
  failureFlash: true
}));

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.send('Logout error');
    res.redirect('/');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
