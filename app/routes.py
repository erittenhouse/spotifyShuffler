import requests
from flask import render_template
from app import app

@app.route('/')
@app.route('/index')
def index():

    test_user = {'username': 'Aislinn'}
    return render_template('login.html', user=test_user)