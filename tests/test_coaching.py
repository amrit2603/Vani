import unittest
from unittest.mock import Mock, patch

import coaching
from app import app
from fastapi.testclient import TestClient


class CoachingTests(unittest.TestCase):
    def setUp(self):
        coaching.CALLS.clear()

    def test_consent_is_required(self):
        with patch('app.assist') as call:
            response = TestClient(app, base_url='http://localhost').post('/api/assist', json={'text':'hello','action':'coach'})
            self.assertEqual(response.status_code, 422)
            call.assert_not_called()

    def test_key_file_is_not_a_public_asset(self):
        client = TestClient(app, base_url='http://localhost')
        self.assertEqual(client.get('/.env').status_code, 404)
        self.assertNotIn('GEMINI_API_KEY', client.get('/api/health').text)

    def test_missing_configuration_does_not_send(self):
        with patch.object(coaching, 'settings', return_value={}), patch.object(coaching.httpx, 'Client') as client:
            with self.assertRaises(RuntimeError):
                coaching.assist('hello','coach')
            client.assert_not_called()

    def test_key_in_header_and_bounded_request(self):
        client = Mock()
        response = Mock(status_code=200)
        response.json.return_value = {'candidates':[{'content':{'parts':[{'text':'Use an example.'}]}}]}
        client.__enter__ = Mock(return_value=client)
        client.__exit__ = Mock(return_value=False)
        client.post.return_value = response
        with patch.object(coaching, 'settings', return_value={'GEMINI_API_KEY':'test-only','GEMINI_MODEL':'gemini-test'}), patch.object(coaching.httpx, 'Client', return_value=client):
            self.assertEqual(coaching.assist('hello','coach')['text'], 'Use an example.')
            args = client.post.call_args
            self.assertNotIn('test-only', args.args[0])
            self.assertEqual(args.kwargs['headers']['x-goog-api-key'], 'test-only')
            with self.assertRaises(RuntimeError):
                coaching.assist('again','coach')
            self.assertEqual(client.post.call_count,1)

    def test_input_bounds(self):
        for text, action in [('', 'coach'),('x'*12001,'coach'),('ok','execute')]:
            with self.assertRaises(ValueError):
                coaching.assist(text, action)


if __name__ == '__main__':
    unittest.main()
