// script.js
document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0); // Ensure the page starts at the top

    const gallery = document.getElementById('gallery');
    
    const images = [
        { src: './resources/image1.png', caption: 'Our first date 23/06/21' },
        { src: './resources/image2.png', caption: 'Bunny delievery 25/06/21' },
        { src: './resources/image3.jpg', caption: 'Graduation 29/06/21' },
        { src: './resources/image4.jpg', caption: 'Bicycle meet up 31/07/21' },
        { src: './resources/image5.png', caption: 'Cottage 06/08/21' },
        { src: './resources/image6.png', caption: 'cry 12/08/21' },
        { src: './resources/image7.png', caption: 'first year 25/03/22' },
        { src: './resources/image8.png', caption: 'cne 27/08/22' },
        { src: './resources/image9.png', caption: 'halloween 31/10/22' },
        { src: './resources/image10.jpg', caption: 'k1 kitchener 19/06/23' },
        { src: './resources/image11.png', caption: 'fancy 03/11/23' },
        { src: './resources/image12.png', caption: 'south korea!! 12/11/23' },

        // Add more images and captions here
    ];

    images.forEach((item, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = `Image ${index + 1}`;
        
        const caption = document.createElement('div');
        caption.className = 'caption';
        caption.textContent = item.caption;

        galleryItem.appendChild(img);
        galleryItem.appendChild(caption);
        gallery.appendChild(galleryItem);
    });

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.classList.remove('hidden');
            } else {
                entry.target.classList.remove('visible');
                entry.target.classList.add('hidden');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.gallery-item').forEach(item => {
        observer.observe(item);
    });
});
