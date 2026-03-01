import json

def clean_brands():
    with open('combined_output.json', 'r') as f:
        data = json.load(f)

    # Specific bad exact pairs to completely drop from the dataset if they are the only two
    bad_pairs = [
        {"ghirardelli", "kellogg"},
        {"motion twin", "motive"},
        {"fireking", "turtle beach"},
        {"general", "ritter sport"},
    ]
    
    # Items that are just generic bad data and should be removed from any cluster
    bad_items = {"none", "online", "general"}
    
    cleaned_data = {}
    new_id = 1
    
    for k, v in data.items():
        # lowercase and strip to compare, but keep original for saving
        # Wait, the data inside v is mostly lowercased already, let's rely on that.
        
        # Check if the cluster exactly matches a bad pair
        cluster_set = {x.lower().strip() for x in v}
        
        if len(v) == 2:
            is_bad_pair = False
            for bp in bad_pairs:
                if cluster_set == bp:
                    is_bad_pair = True
                    break
            if is_bad_pair:
                continue
                
        # Filter out bad items
        new_v = [brand for brand in v if brand.lower().strip() not in bad_items]
        
        # Remove empty or single items if they were reduced from a pair unless they uniquely identify something
        # Actually, if a cluster drops to 1 item because we removed 'none', it's just a single brand which is fine to keep, 
        # or we can drop clusters of size < 2.
        # The user's goal is to clean the file of previously combined brands. If it's a single brand, it's not a combined brand.
        # But wait, did the original data have size 1 clusters? Let's keep them if they were originally size >= 1
        
        if len(new_v) >= 1:
            # check the string lengths. Sometimes there's extremely long grouped strings that are bad scraping:
            # like "chips ahoynutter butteroreoritz"
            # We can filter out items that are suspiciously long and merged if they appear alongside the correct ones
            new_v_filtered = []
            for item in new_v:
                if len(item) > 30 and ' ' not in item:
                    # super long string with no spaces is probably a scrape error
                    pass
                else:
                    new_v_filtered.append(item)
                    
            if len(new_v_filtered) > 0:
                cleaned_data[str(new_id)] = new_v_filtered
                new_id += 1

    print(f"Original clusters: {len(data)}")
    print(f"Cleaned clusters: {len(cleaned_data)}")

    with open('combined_output.json', 'w') as f:
        json.dump(cleaned_data, f, indent=2)
        
    print("Saved to combined_output.json")

if __name__ == '__main__':
    clean_brands()
