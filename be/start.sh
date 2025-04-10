#!/bin/bash

curl -fsSL https://pyenv.run | bash
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init - bash)"' >> ~/.bashrc

sudo apt-get install lzma liblzma-dev libbz2-dev libsqlite3-dev -y 

pyenv install 3.10.9
pyenv virtualenv 3.10.9 alikiasu
pyenv activate alikiasu
pip install -r requirements.txt
python index.py --port 8001