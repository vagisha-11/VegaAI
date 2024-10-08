// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Logout from './pages/Logout';

function App() {
	return (
		<Router>
			<Routes>
				<Route path='/' exact element={<Home />} />
				<Route path='/login' exact element={<Login />} />
				<Route path='/register' exact element={<Register />} />
				<Route path='/logout' exact element={<Logout />} />
			</Routes>
		</Router>
	);
}

export default App;
