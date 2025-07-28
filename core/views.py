from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import JsonResponse
from properties.models import Property, PropertyCategory, PropertyImage
from agents.models import AgentProfile

def ajax_property_image_upload(request):
    if request.method == 'POST' and request.FILES.get('image'):
        property_id = request.POST.get('property_id')
        try:
            property_obj = Property.objects.get(id=property_id)
            image = request.FILES['image']
            property_image = PropertyImage.objects.create(
                property=property_obj,
                image=image,
                is_primary=not property_obj.images.exists()
            )
            return JsonResponse({
                'success': True,
                'image_id': property_image.id,
                'image_url': property_image.image.url
            })
        except Property.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Property not found'})
    return JsonResponse({'success': False, 'error': 'Invalid request'})

class HomeView(TemplateView):
    template_name = 'home.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Get featured properties (verified and featured)
        context['featured_properties'] = Property.objects.filter(
            is_verified=True,
            is_featured=True
        ).select_related('category').prefetch_related('images')[:6]
        
        # Get all property categories for the search form
        context['categories'] = PropertyCategory.objects.all()
        
        # Get testimonials
        context['testimonials'] = Testimonial.objects.filter(
            is_approved=True
        ).select_related('client')[:3]
        
        return context 

def handler404(request, exception):
    return render(request, '404.html', status=404)

def handler500(request):
    return render(request, '500.html', status=500) 