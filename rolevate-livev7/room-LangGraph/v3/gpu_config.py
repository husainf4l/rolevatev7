# gpu_config.py
import os
import torch
import logging

logger = logging.getLogger(__name__)

def setup_gpu_config():
    """
    Configure GPU settings for optimal performance with RTX 4070 Ti SUPER.
    Returns True if GPU is available and configured, False otherwise.
    """
    try:
        # Check if CUDA is available
        if not torch.cuda.is_available():
            logger.info("❌ CUDA not available, using CPU")
            return False
        
        # Set GPU environment variables for optimal performance
        os.environ["CUDA_VISIBLE_DEVICES"] = "0"  # Use GPU 0
        os.environ["CUDA_LAUNCH_BLOCKING"] = "0"  # Async kernel launches
        
        # Set memory management
        torch.cuda.empty_cache()  # Clear GPU cache
        
        # Enable memory fraction (use 70% of GPU memory max to reduce RAM usage)
        if torch.cuda.is_available():
            torch.cuda.set_per_process_memory_fraction(0.7)
        
        # Enable optimizations
        torch.backends.cudnn.enabled = True
        torch.backends.cudnn.benchmark = True  # Optimize for consistent input sizes
        torch.backends.cudnn.deterministic = False  # Allow non-deterministic for speed
        
        # Memory optimization for reduced RAM usage
        os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:128"
        
        logger.info("✅ GPU configuration optimized for reduced memory usage")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error setting up GPU config: {e}")
        return False

def print_gpu_status():
    """Print detailed GPU status information."""
    try:
        if not torch.cuda.is_available():
            print("🚫 No GPU available")
            return
        
        device_count = torch.cuda.device_count()
        current_device = torch.cuda.current_device()
        device_name = torch.cuda.get_device_name(current_device)
        
        # Memory info
        memory_allocated = torch.cuda.memory_allocated(current_device) / 1024**3  # GB
        memory_reserved = torch.cuda.memory_reserved(current_device) / 1024**3    # GB
        memory_total = torch.cuda.get_device_properties(current_device).total_memory / 1024**3  # GB
        
        print(f"🚀 GPU Status:")
        print(f"   Device Count: {device_count}")
        print(f"   Current Device: {current_device} ({device_name})")
        print(f"   Memory: {memory_allocated:.2f}GB allocated / {memory_reserved:.2f}GB reserved / {memory_total:.2f}GB total")
        print(f"   PyTorch Version: {torch.__version__}")
        print(f"   CUDA Version: {torch.version.cuda}")
        
        # Quick performance test
        try:
            start_time = torch.cuda.Event(enable_timing=True)
            end_time = torch.cuda.Event(enable_timing=True)
            
            start_time.record()
            # Simple matrix multiplication test
            x = torch.randn(1000, 1000, device='cuda')
            y = torch.randn(1000, 1000, device='cuda')
            z = torch.mm(x, y)
            torch.cuda.synchronize()
            end_time.record()
            
            elapsed_time = start_time.elapsed_time(end_time)
            print(f"   Performance Test: 1000x1000 matrix mult in {elapsed_time:.2f}ms ⚡")
            
            # Cleanup
            del x, y, z
            torch.cuda.empty_cache()
            
        except Exception as e:
            print(f"   ⚠️ Performance test failed: {e}")
            
    except Exception as e:
        logger.error(f"Error printing GPU status: {e}")

def get_optimal_device():
    """Get the optimal device for model inference."""
    if torch.cuda.is_available():
        return torch.device('cuda')
    else:
        return torch.device('cpu')

def optimize_for_inference():
    """Apply inference-specific optimizations."""
    if torch.cuda.is_available():
        # Enable inference mode optimizations
        torch.cuda.empty_cache()
        torch.cuda.synchronize()
        
        # Set to inference mode (no gradients needed)
        torch.set_grad_enabled(False)
        
        # Aggressive memory cleanup
        import gc
        gc.collect()
        torch.cuda.empty_cache()
        
        return True
    return False

def cleanup_memory():
    """Aggressive memory cleanup for reduced RAM usage."""
    try:
        import gc
        gc.collect()
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
            
        # Force Python garbage collection
        gc.collect()
        
    except Exception as e:
        logger.error(f"Error during memory cleanup: {e}")