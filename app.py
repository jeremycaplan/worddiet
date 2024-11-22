from flask import Flask, render_template, request, jsonify
import nltk
from nltk.corpus import wordnet
import os

# Download required NLTK data
nltk.download('wordnet')
nltk.download('omw-1.4')

app = Flask(__name__)

# Dictionary of intensifier mappings
INTENSIFIER_MAPPINGS = {
    'very': {
        'large': 'huge',
        'small': 'tiny',
        'good': 'excellent',
        'bad': 'terrible',
        'happy': 'elated',
        'sad': 'devastated',
        'tired': 'exhausted',
        'angry': 'furious',
        'beautiful': 'gorgeous',
        'important': 'crucial',
        'difficult': 'arduous',
        'easy': 'effortless',
        'cold': 'freezing',
        'hot': 'scorching',
        'bright': 'dazzling',
        'dark': 'pitch-black',
        'quiet': 'silent',
        'loud': 'deafening',
        'fast': 'rapid',
        'slow': 'sluggish'
    },
    'extremely': {
        'large': 'enormous',
        'small': 'microscopic',
        'good': 'outstanding',
        'bad': 'atrocious',
        'happy': 'overjoyed',
        'sad': 'heartbroken',
        'tired': 'depleted',
        'angry': 'enraged',
        'beautiful': 'stunning',
        'important': 'vital',
        'difficult': 'insurmountable',
        'easy': 'simple',
        'cold': 'arctic',
        'hot': 'sweltering',
        'bright': 'blinding',
        'dark': 'obscure',
        'quiet': 'hushed',
        'loud': 'thunderous',
        'fast': 'lightning-fast',
        'slow': 'lethargic'
    }
}

def find_simpler_word(input_text):
    # Split the input into words
    words = input_text.lower().split()
    
    # Check for intensifier patterns
    if len(words) == 2:
        intensifier, word = words
        if intensifier in INTENSIFIER_MAPPINGS and word in INTENSIFIER_MAPPINGS[intensifier]:
            return INTENSIFIER_MAPPINGS[intensifier][word]
    
    # If not an intensifier pattern or no mapping found, try to simplify the last word
    word_to_simplify = words[-1]
    simpler_alternatives = []
    
    # Get synsets for the input word
    synsets = wordnet.synsets(word_to_simplify)
    
    if not synsets:
        return None
        
    # Get all lemmas from all synsets
    for synset in synsets:
        for lemma in synset.lemmas():
            word = lemma.name()
            # Only consider shorter words that aren't the same as input
            if len(word) < len(word_to_simplify) and word != word_to_simplify:
                simpler_alternatives.append(word)
    
    # Sort by length (shortest first) and remove duplicates while preserving order
    seen = set()
    simpler_alternatives = [x for x in sorted(simpler_alternatives, key=len) 
                          if not (x in seen or seen.add(x))]
    
    return simpler_alternatives[0] if simpler_alternatives else None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/simplify', methods=['POST'])
def simplify():
    data = request.get_json()
    complex_text = data.get('word', '').lower().strip()
    
    if not complex_text:
        return jsonify({'error': 'Please enter a word or phrase'})
    
    simpler_word = find_simpler_word(complex_text)
    
    if simpler_word:
        return jsonify({'result': simpler_word})
    else:
        return jsonify({'error': 'No simpler alternative found'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
