import requests

# Test OPTIONS preflight
print('Testing OPTIONS preflight...')
r = requests.options('http://127.0.0.1:8000/ask', headers={'Origin': 'http://localhost:5173'})
print(f'OPTIONS Status: {r.status_code}')

# Test POST
print('Testing POST /ask...')
r = requests.post('http://127.0.0.1:8000/ask', 
    json={'question': 'What is testing?', 'marks': 5},
    headers={'Origin': 'http://localhost:5173'})
print(f'POST Status: {r.status_code}')
if r.status_code == 200:
    print('Response: Success - got answer')
else:
    print(f'Response: {r.text[:200]}')
