import json

def fix_gaming_clusters():
    with open('combined_output.json', 'r') as f:
        data = json.load(f)
        
    # Words/brands that incorrectly link things together
    bad_connectors = {
        "generic", "license", "disguise", "singland", "interactive communications",
        "tbdress", "controller gear", "insten", "petra industries", "totinos"
    }

    # Distinct publisher groups that should NEVER be in the same cluster
    distinct_publishers = {
        "nintendo": ["nintendo", "nintendo co", "nintendo switch", "switch", "mario -nintendo"],
        "ea": ["electronic arts", "electronics arts", "ea sports"],
        "take2": ["take two", "take 2 interactive", "2k"],
        "ubisoft": ["ubisoft"],
        "activision": ["activision"],
        "microsoft": ["microsoft", "microsfot", "xbox", "xbox game studios", "mojang", "mojang studios", "minecraft"],
        "bethesda": ["bethesda softworks", "bethesda"],
        "sega": ["sega"],
        "sony": ["sony", "playstation"],
        "505games": ["505 games"]
    }
    
    # map brand to its core distinct publisher
    brand_to_publisher = {}
    for pub, brands in distinct_publishers.items():
        for b in brands:
            brand_to_publisher[b] = pub
            
    processed_data = {}
    new_id = 1
    
    for k, cluster in data.items():
        # First remove bad connectors
        cleaned_cluster = [b for b in cluster if b.lower() not in bad_connectors]
        
        # Check if this cluster contains multiple distinct publishers
        pubs_in_cluster = {}
        for b in cleaned_cluster:
            b_low = b.lower()
            if b_low in brand_to_publisher:
                pub = brand_to_publisher[b_low]
                if pub not in pubs_in_cluster:
                    pubs_in_cluster[pub] = []
                pubs_in_cluster[pub].append(b)
                
        if len(pubs_in_cluster) > 1:
            # We have a collision! e.g., Nintendo and EA in the same cluster.
            # We must break this cluster apart into separate clusters for each publisher.
            # What happens to brands in this cluster that DO NOT belong to a known publisher?
            # We can either drop them or put them in their own isolated clusters.
            # Let's put unassigned brands in a separate list and drop them to be safe, 
            # since they were probably bad connectors we missed.
            unassigned = [b for b in cleaned_cluster if b.lower() not in brand_to_publisher]
            
            for pub, pub_brands in pubs_in_cluster.items():
                processed_data[str(new_id)] = pub_brands
                new_id += 1
                
            # If there are unassigned brands, they might be valid separate brands (like 'jakks pacific' or 'pdp')
            # Let's just make them single item clusters so they aren't lost, or group them together.
            for unassigned_brand in unassigned:
                processed_data[str(new_id)] = [unassigned_brand]
                new_id += 1
                
        elif len(cleaned_cluster) > 0:
            # Normal cluster, just save it
            processed_data[str(new_id)] = cleaned_cluster
            new_id += 1

    print(f"Original clusters: {len(data)}")
    print(f"Processed clusters: {len(processed_data)}")

    with open('combined_output.json', 'w') as f:
        json.dump(processed_data, f, indent=2)

if __name__ == '__main__':
    fix_gaming_clusters()
