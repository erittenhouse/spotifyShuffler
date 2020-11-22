import os

class Config(object):
    client_id = os.environ.get('CLIENT_ID') or 'b817214b1ce74e28844cd890f5a050a3'
    client_secret = os.environ.get('CLIENT_SECRET') or '6a74579918844fbbb727d9f56e4883a8'
    redirect_uri = os.environ.get('REDIRECT_URI') or 'http://localhost:5000/shuffle/'
