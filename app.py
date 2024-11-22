from flask import Flask, render_template, request, jsonify
import nltk
from nltk.corpus import wordnet
import os

# Download required NLTK data
nltk.download('wordnet')
nltk.download('omw-1.4')
nltk.download('brown')  # For word frequency
from nltk.corpus import brown

# Create word frequency dictionary
word_freq = nltk.FreqDist(i.lower() for i in brown.words())

app = Flask(__name__)

# Dictionary of intensifier mappings with simpler alternatives
INTENSIFIER_MAPPINGS = {
    'very': {
        'large': 'big',
        'small': 'tiny',
        'good': 'great',
        'bad': 'awful',
        'happy': 'glad',
        'sad': 'upset',
        'tired': 'beat',
        'angry': 'mad',
        'beautiful': 'lovely',
        'important': 'key',
        'difficult': 'hard',
        'easy': 'simple',
        'cold': 'icy',
        'hot': 'burning',
        'bright': 'sunny',
        'dark': 'dim',
        'quiet': 'soft',
        'loud': 'noisy',
        'fast': 'quick',
        'slow': 'lazy'
    },
    'extremely': {
        'large': 'huge',
        'small': 'tiny',
        'good': 'great',
        'bad': 'awful',
        'happy': 'joyful',
        'sad': 'gloomy',
        'tired': 'drained',
        'angry': 'livid',
        'beautiful': 'lovely',
        'important': 'vital',
        'difficult': 'tough',
        'easy': 'basic',
        'cold': 'frigid',
        'hot': 'boiling',
        'bright': 'shining',
        'dark': 'black',
        'quiet': 'silent',
        'loud': 'roaring',
        'fast': 'swift',
        'slow': 'plodding'
    }
}

def count_syllables(word):
    """Estimate syllable count using a simple vowel-based approach"""
    word = word.lower()
    count = 0
    vowels = "aeiouy"
    if word[0] in vowels:
        count += 1
    for index in range(1, len(word)):
        if word[index] in vowels and word[index - 1] not in vowels:
            count += 1
    if word.endswith("e"):
        count -= 1
    if count == 0:
        count += 1
    return count

def get_word_complexity_score(word):
    """Calculate a complexity score based on frequency, length, and syllables"""
    frequency = word_freq[word] if word in word_freq else 0
    frequency_score = 1 if frequency > 100 else 0.5 if frequency > 10 else 0
    length_score = 1 if len(word) <= 5 else 0.5 if len(word) <= 7 else 0
    syllable_score = 1 if count_syllables(word) <= 2 else 0.5 if count_syllables(word) <= 3 else 0
    
    return frequency_score + length_score + syllable_score

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
    alternatives = []
    
    # Get synsets for the input word
    synsets = wordnet.synsets(word_to_simplify)
    
    if not synsets:
        return None
        
    # Get all lemmas from all synsets
    for synset in synsets:
        for lemma in synset.lemmas():
            word = lemma.name()
            # Only consider words that are shorter than input
            if len(word) < len(word_to_simplify) and word != word_to_simplify:
                alternatives.append((word, get_word_complexity_score(word)))
    
    # Sort by complexity score (higher is simpler) and length
    alternatives.sort(key=lambda x: (-x[1], len(x[0])))
    
    return alternatives[0][0] if alternatives else None

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
