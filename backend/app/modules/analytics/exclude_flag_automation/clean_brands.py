import json
import re
import difflib

def normalize(name):
    name = name.lower()
    name = re.sub(r'\b(and|n|\&)\b', '', name)   # remove "and", "n", "&"
    name = re.sub(r'^\bthe\b\s+', '', name)   # remove leading "the"
    name = re.sub(r'[^a-z0-9]', '', name)     # remove all special chars and spaces
    return name

def is_match(name1, name2):
    norm1 = normalize(name1)
    norm2 = normalize(name2)
    
    if not norm1 or not norm2:
        return False
        
    if norm1 == norm2:
        return True
    
    # Check if one is exactly inside another
    if norm1 in norm2 or norm2 in norm1:
        # e.g., 'northwest' and 'northwestgroup' might be okay but let's be careful
        # actually, if 'un brand' and 'unbranded' -> norm1='unbrand', norm2='unbranded' (norm1 in norm2)
        # However, let's just use string ratio for a bit more strictness
        ratio = difflib.SequenceMatcher(None, norm1, norm2).ratio()
        if ratio > 0.85:
            return True
            
    # Maybe word by word?
    return False

def main():
    try:
        with open('combined_output.json', 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading file: {e}")
        return
        
    suspicious = []
    new_data = {}
    new_id = 1

    for k, v in data.items():
        if len(v) != 2:
            continue
        n1, n2 = v[0], v[1]
        
        if is_match(n1, n2):
            new_data[str(new_id)] = v
            new_id += 1
        else:
            suspicious.append(v)

    print(f"Total: {len(data)}")
    print(f"Good: {len(new_data)}")
    print(f"Suspicious: {len(suspicious)}")

    print("\nSuspicious samples (Top 30):")
    for s in suspicious[:30]:
        print(f" - {s[0]}  ||  {s[1]}")

    with open('cleaned_output.json', 'w') as f:
        json.dump(new_data, f, indent=2)
        
    # Also save suspicious for review
    with open('suspicious_output.json', 'w') as f:
        json.dump(suspicious, f, indent=2)

if __name__ == "__main__":
    main()
