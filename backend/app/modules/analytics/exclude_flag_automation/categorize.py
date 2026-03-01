import json

with open('suspicious_output.json') as f:
    suspicious = json.load(f)

no_overlap = []
substrings = []
partial = []

def get_words(name):
    return set(name.lower().replace('&', '').replace('-', ' ').split())

for s in suspicious:
    n1, n2 = s[0], s[1]
    w1 = get_words(n1)
    w2 = get_words(n2)
    
    # Check if string1 in string2 physically without word boundary
    n1_clean = n1.lower().replace(' ', '')
    n2_clean = n2.lower().replace(' ', '')
    
    if n1_clean in n2_clean or n2_clean in n1_clean:
        substrings.append(s)
    elif w1.intersection(w2):
        partial.append(s)
    else:
        no_overlap.append(s)

print(f"Substrings: {len(substrings)}")
print(f"Partial overlap: {len(partial)}")
print(f"No overlap: {len(no_overlap)}")

print("\n--- No overlap samples (showing 30) ---")
for x in no_overlap[:30]:
    print(f"{x[0]}  ||  {x[1]}")

print("\n--- Partial overlap samples (showing 30) ---")
for x in partial[:30]:
    print(f"{x[0]}  ||  {x[1]}")

with open('no_overlap.json', 'w') as f: json.dump(no_overlap, f)
with open('partial.json', 'w') as f: json.dump(partial, f)
