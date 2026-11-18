import ast
import unittest
from pathlib import Path

class GpuBudgetTests(unittest.TestCase):
    def test_short_and_long_reservations_are_bounded(self):
        tree=ast.parse(Path('hosting/app.py').read_text(encoding='utf-8'))
        node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='gpu_duration')
        scope={'SAMPLE_RATE':16000}
        exec(compile(ast.Module(body=[node],type_ignores=[]),'gpu_duration','exec'),scope)
        self.assertEqual(scope['gpu_duration'](range(4*16000),'en'),20)
        self.assertEqual(scope['gpu_duration'](range(30*16000),'en'),25)
        self.assertEqual(scope['gpu_duration'](range(120*16000),'hi'),60)
