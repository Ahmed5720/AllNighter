from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import os
import fitz
from llamaapi import LlamaAPI
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # Allow requests from the React app
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

'''def rank_concept(content):
    piechart = {}
    frequency_table = []
    #ranked concepts is what we use for table, consist of concept and val 
    ranked_concepts = {}
    total_questions = sum(sum(concepts.values()) for concepts in content.values())
    total_sum = 0
    topic_sums = []
    for topic in content.items():
        topic_sum = 0
        concept_frequency = {}
        t = dict(topic[1]) 
        for i, (concept, value) in enumerate(t.items()):  
            
            topic_sum += value
            concept_frequency[concept] = value
        topic_sums.append(topic_sum)
        frequency_table.append(concept_frequency)
        piechart[topic[0]] = topic_sum
        total_sum += topic_sum  

    for i, topic in enumerate(content.items()):
        t = dict(topic[1]) 
        
        for concept, value in t.items():  # Corrected unpacking
            
            if topic_sums[i] == 0:
                concept_rank = (topic_sums[i] / total_sum) * (value / 1)
            else:
                concept_rank = (topic_sums[i] / total_sum) * (value / topic_sums[i])
            ranked_concepts[concept] = concept_rank  # Correct storage



    ranked_concepts = dict(sorted(ranked_concepts.items(), key=lambda x: x[1], reverse=True))
    
    return piechart, frequency_table, ranked_concepts'''
def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text("text") + "\n"
    return text

def parse_llm_output(text):
    topics = {}
    text = text.split("\n\n", 1)[1]  # Keeps everything after the first double newline
    
    # Split by sections (topics) using bold topic names as markers
    sections = re.split(r'\n\n\*\*(.*?)\*\*\n\n', text)[1:]  # Extracts topic names and their contents

    for i in range(0, len(sections), 2):
        topic = sections[i].strip()
        concepts = sections[i + 1].strip().split("\n")

        topic_dict = {}
        for concept in concepts:
            match = re.match(r'\d+\.\s(.+):\s(\d+)', concept)
            if match:
                concept_name = match.group(1)
                frequency = int(match.group(2))
                topic_dict[concept_name] = frequency

        topics[topic] = topic_dict

    return topics

def giveRecommendations(topic_concepts, time):
    return 



@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({"error": "No files uploaded"}), 400

    files = request.files.getlist('files')
    if not files or all(file.filename == '' for file in files):
        return jsonify({"error": "No selected files"}), 400

    extracted_text = ''
    for file in files:
        if file.filename.endswith('.pdf'):
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(file_path)
            extracted_text += extract_text_from_pdf(file_path)

    prompt_content2 = f"""
    I have extracted text from multiple exams. Your task is to find the concept of each question, find the number of times a question shows up on that concept and finally find the general topics for each group of concepts. in order to do that you will do this:
    I need you to go over each question and find the specific concept that each question belongs to
    For each concept, count the number of questions on that concept. now after doing that, for each group of concepts that belong to a similar topic, give them a topic name and print that topic name then a colon then the concepts for that topic.
    Do not include any detailed explanations or problem descriptions.
    for example your output shoud look like this: 1 Integration: integration by partial fractions, 2 integration by u substitution. Derivatives: power rule, product rule. 
    Make sure to print the colon between each topic and its respective concepts. Make sure to print the count of occurrence of each concept and provide it. 
    Here is the extracted text:
    {extracted_text}
    """

    api_request_json = {
        "model": "llama3-70b",
        "messages": [
            {"role": "user", "content": prompt_content2}
        ],
        "stream": False,
    }
    llama = LlamaAPI("LA-69b8340cf2194e25ad3143ba29379e0bbc9bb0169815476da9a39791727c0bfd")
    response = llama.run(api_request_json)

    summary = response.json()
# Debugging line
    #print(summary)

    
    # Check if the response contains the expected structure
    if isinstance(summary, dict) and 'choices' in summary and len(summary['choices']) > 0:
        content = summary['choices'][0]['message']['content']
        content = parse_llm_output(content)
        print('zobry was', content)
        return jsonify({"summary": content})
    else:
        return jsonify({"error": "Invalid response from Llama API"}), 500

if __name__ == '__main__':
    app.run(host = '0.0.0.0', port = 5000)
