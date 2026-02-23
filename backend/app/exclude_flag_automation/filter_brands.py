import json
import re
import difflib

def normalize(name):
    name = name.lower()
    name = re.sub(r'\b(and|n|\&)\b', '', name)
    name = re.sub(r'^\bthe\b\s+', '', name)
    # convert numbers
    name = name.replace('3', 'three').replace('4', 'four').replace('1', 'one').replace('2', 'two').replace('5', 'five')
    name = re.sub(r'[^a-z0-9]', '', name)
    return name

def is_valid_match(n1, n2):
    n1_norm = normalize(n1)
    n2_norm = normalize(n2)
    
    if n1_norm == n2_norm:
        return True
        
    ratio = difflib.SequenceMatcher(None, n1_norm, n2_norm).ratio()
    if ratio > 0.85:
        return True
        
    w1 = set(n1.lower().replace('&', '').replace('-', ' ').split())
    w2 = set(n2.lower().replace('&', '').replace('-', ' ').split())
    
    # Generic or common parent brands
    stopwords = {'chocolate', 'candy', 'the', 'company', 'co', 'inc', 'llc', 'brand', 'brands', 'store', 'group', 'wrigley', 'nestle', 'wonka', 'mars', 'kellogg'}
    
    # If one is a strict substring of another
    # e.g. "skittles" and "wrigley skittles"
    if n1_norm in n2_norm or n2_norm in n1_norm:
        # Check if the longer string is ridiculously long and merged (e.g. chipsahoynutterbutter)
        if len(max(n1_norm, n2_norm, key=len)) > 25 and len(min(n1_norm, n2_norm, key=len)) < 15:
            return False
        return True
        
    # Overlap of words
    overlap = w1.intersection(w2) - stopwords
    if overlap:
        # if they share a meaningful word, are they mostly similar?
        # e.g. "john freida" vs "john frieda" -> ratio handles it.
        # "wrigley skittles" vs "wrigley lifesavers" -> overlap="wrigley".
        # We shouldn't keep it just because they share "wrigley" or "farms"
        
        # calculate non-overlapping words
        diff1 = w1 - w2 - stopwords
        diff2 = w2 - w1 - stopwords
        
        # If the differences are small (typos) ratio usually catches it.
        # if the remaining words are totally different, probably bad.
        # Let's see if the remaining words are similar
        if len(diff1) <= 1 and len(diff2) <= 1:
            # e.g. freida vs frieda
            if diff1 and diff2:
                r = difflib.SequenceMatcher(None, list(diff1)[0], list(diff2)[0]).ratio()
                if r > 0.7:
                    return True
            else:
                return True
                
        # "cali pizza kitchen" vs "california pizza kitchen"
        # diff1 = {'cali'}, diff2 = {'california'}
        if 'cali' in diff1 and 'california' in diff2: return True
        
    return False

def main():
    with open('combined_output.json', 'r') as f:
        data = json.load(f)
        
    cleaned = {}
    dropped = []
    
    new_id = 1
    for k, v in data.items():
        if len(v) == 2:
            n1, n2 = v[0], v[1]
            if is_valid_match(n1, n2):
                cleaned[str(new_id)] = v
                new_id += 1
            else:
                # also handle 'none'
                if n1.lower() == 'none' or n2.lower() == 'none':
                    dropped.append(v)
                else:
                    dropped.append(v)
                    
    print(f"Total original: {len(data)}")
    print(f"Cleaned (kept): {len(cleaned)}")
    print(f"Dropped: {len(dropped)}")
    
    print("\n--- Dropped Samples ---")
    for d in dropped[:40]:
        print(f"{d[0]}  ||  {d[1]}")
        
    with open('combined_output.json', 'w') as f:
        json.dump(cleaned, f, indent=2)
        
    print("\nCleaned data written back to combined_output.json")

if __name__ == '__main__':
    main()
