import pandas as pd
import os

def prepare_drishtix_data():
    print("Step 1: Initializing Data Pipeline...")
    
    # Define the path to your datasets folder
    # Using relative paths ensures it works on your teammate's computer too
    dataset_dir = "../datasets"
    
    try:
        # 1. Load the Core Features (The physical crowd movement)
        print("Loading crowd flow features...")
        features_path = os.path.join(dataset_dir, "crowd_flow_data_10k.csv")
        df_features = pd.read_csv(features_path)
        
        # 2. Load the Targets (What the AI needs to predict)
        print("Loading prediction targets...")
        targets_path = os.path.join(dataset_dir, "prediction_targets_10k.csv")
        df_targets = pd.read_csv(targets_path)
        
        # 3. Concatenate the data
        # Since our synthetic data was generated in parallel, we can combine them side-by-side
        print("Merging datasets into master training frame...")
        df_master = pd.concat([df_features, df_targets], axis=1)
        
        # 4. Data Validation Check
        # Ensure we don't have any missing values that will crash the AI
        if df_master.isnull().values.any():
            print("Warning: Missing values detected. Dropping incomplete rows.")
            df_master = df_master.dropna()
            
        print(f"Data Preparation Complete! Master dataset contains {len(df_master)} records.")
        
        # Display a quick snapshot for documentation/debugging
        print("\nSnapshot of combined data:")
        print(df_master[['crowd_count', 'inflow_rate', 'risk_level_t+10']].head(3))
        
        return df_master
        
    except FileNotFoundError as e:
        print(f"\nERROR: Could not find the dataset. Make sure your CSVs are inside the 'datasets' folder!")
        print(f"Exact error: {e}")
        return None

if __name__ == "__main__":
    # Test the pipeline when running this script directly
    master_data = prepare_drishtix_data()