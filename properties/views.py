from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from django.core.paginator import Paginator
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.http import JsonResponse
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
from .models import Property, PropertyCategory, PropertyInquiry, PropertyViewing, PropertyFeature
=======
from .models import Property, PropertyCategory, PropertyInquiry, PropertyViewing
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
=======
from .models import Property, PropertyCategory, PropertyInquiry, PropertyViewing
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
=======
from .models import Property, PropertyCategory, PropertyInquiry, PropertyViewing
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
from django.views.decorators.csrf import csrf_exempt
from .models import Property, PropertyImage
from django.core.files.storage import default_storage
import os

# Create your views here.

@csrf_exempt  # Optional: consider using CSRF token if admin-only
def ajax_property_image_upload(request, property_id):
    if request.method == "POST":
        try:
            property_obj = Property.objects.get(id=property_id)
            
            # Get all files from the request
            files = request.FILES.getlist('file') or request.FILES.getlist('image')
            if not files:
                return JsonResponse({
                    'success': False,
                    'error': 'No image files provided'
                }, status=400)

            uploaded_images = []
            for image_file in files:
                # Create the property image
                property_image = PropertyImage.objects.create(
                    property=property_obj,
                    image=image_file,
                    is_primary=not property_obj.images.exists()  # First image is primary
                )
                uploaded_images.append({
                    'id': property_image.id,
                    'url': property_image.image.url
                })

            return JsonResponse({
                'success': True,
                'images': uploaded_images
            })

        except Property.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Property not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'error': 'Invalid request method'
    }, status=400)

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
def remove_favorite(request, slug):
    """Remove a property from user's favorites"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    try:
        property_obj = Property.objects.get(slug=slug)
        if property_obj in request.user.favorites.all():
            request.user.favorites.remove(property_obj)
            return JsonResponse({'success': True, 'message': 'Property removed from favorites'})
        else:
            return JsonResponse({'error': 'Property not in favorites'}, status=400)
    except Property.DoesNotExist:
        return JsonResponse({'error': 'Property not found'}, status=404)

=======
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
=======
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
=======
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
class PropertyListView(ListView):
    model = Property
    template_name = 'properties/list.html'
    context_object_name = 'properties'
    paginate_by = 9

    def get_queryset(self):
        queryset = Property.objects.filter(is_verified=True)
        
        # Filter by property type
        property_type = self.request.GET.get('property_type')
        if property_type:
            queryset = queryset.filter(property_type=property_type)
        
        # Filter by category
        category = self.request.GET.get('category')
        if category:
            queryset = queryset.filter(category__id=category)
        
        # Filter by price range
        min_price = self.request.GET.get('min_price')
        max_price = self.request.GET.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter by bedrooms and bathrooms
        bedrooms = self.request.GET.get('bedrooms')
        bathrooms = self.request.GET.get('bathrooms')
        if bedrooms:
            queryset = queryset.filter(bedrooms=bedrooms)
        if bathrooms:
            queryset = queryset.filter(bathrooms=bathrooms)
        
        # Filter by features
        features = self.request.GET.getlist('features')
        if features:
            for feature in features:
                queryset = queryset.filter(features__has_key=feature)
        
        # Sort results
        sort = self.request.GET.get('sort', 'newest')
        if sort == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort == 'newest':
            queryset = queryset.order_by('-created_at')
        elif sort == 'area_desc':
            queryset = queryset.order_by('-area')
        
        return queryset.select_related('category', 'agent').prefetch_related('images')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = PropertyCategory.objects.all()
        context['property_types'] = Property.PROPERTY_TYPE_CHOICES
        
        # Add sort label
        sort = self.request.GET.get('sort', 'newest')
        sort_labels = {
            'newest': 'Newest',
            'price_asc': 'Price: Low to High',
            'price_desc': 'Price: High to Low',
            'area_desc': 'Largest Area'
        }
        context['sort_label'] = sort_labels.get(sort, 'Newest')
        
        # Add current filters to context
        context['current_filters'] = {
            'property_type': self.request.GET.get('property_type'),
            'category': self.request.GET.get('category'),
            'min_price': self.request.GET.get('min_price'),
            'max_price': self.request.GET.get('max_price'),
            'bedrooms': self.request.GET.get('bedrooms'),
            'bathrooms': self.request.GET.get('bathrooms'),
            'features': self.request.GET.getlist('features'),
            'sort': sort
        }
        
        return context

class PropertyDetailView(DetailView):
    model = Property
    template_name = 'properties/detail.html'
    context_object_name = 'property'

    def get_queryset(self):
        queryset = Property.objects.select_related('category', 'agent').prefetch_related('images', 'videos')
        
        # Debug information
        print(f"User authenticated: {self.request.user.is_authenticated}")
        if self.request.user.is_authenticated:
            print(f"User: {self.request.user.username}")
            print(f"Has agent_profile attribute: {hasattr(self.request.user, 'agent_profile')}")
            if hasattr(self.request.user, 'agent_profile'):
                print(f"Agent Profile ID: {self.request.user.agent_profile.id}")
        
        # If user is authenticated and is an agent, allow them to view their own unverified properties
        if self.request.user.is_authenticated and hasattr(self.request.user, 'agent_profile'):
            return queryset.filter(
                Q(is_verified=True) | 
                Q(agent=self.request.user.agent_profile)
            )
        
        # For non-agents or unauthenticated users, only show verified properties
        return queryset.filter(is_verified=True)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        property = self.get_object()
        
        # Increment views count
        property.views_count += 1
        property.save()
        
        # Add verification status message for agents
        if self.request.user.is_authenticated and hasattr(self.request.user, 'agent_profile'):
            if property.agent == self.request.user.agent_profile and not property.is_verified:
                context['verification_status'] = {
                    'message': 'This property is pending verification by an administrator.',
                    'type': 'warning'
                }
        
        # Get similar properties
        similar_properties = Property.objects.filter(
            category=property.category,
            is_verified=True
        ).exclude(id=property.id)[:3]
        
        context['similar_properties'] = similar_properties
        return context

@login_required
def schedule_viewing(request, slug):
    property = get_object_or_404(Property, slug=slug, is_verified=True)
    
    if request.method == 'POST':
        viewing = PropertyViewing.objects.create(
            property=property,
            name=request.POST.get('name'),
            email=request.POST.get('email'),
            phone=request.POST.get('phone'),
            preferred_date=request.POST.get('preferred_date'),
            preferred_time=request.POST.get('preferred_time'),
            message=request.POST.get('message', '')
        )
        messages.success(request, 'Your viewing request has been submitted successfully.')
        return redirect('properties:detail', slug=slug)
    
    return render(request, 'properties/schedule_viewing.html', {'property': property})

@login_required
def send_inquiry(request, slug):
    property = get_object_or_404(Property, slug=slug, is_verified=True)
    
    if request.method == 'POST':
        inquiry = PropertyInquiry.objects.create(
            property=property,
            name=request.POST.get('name'),
            email=request.POST.get('email'),
            phone=request.POST.get('phone'),
            message=request.POST.get('message')
        )
        messages.success(request, 'Your inquiry has been sent successfully.')
        return redirect('properties:detail', slug=slug)
    
    return render(request, 'properties/send_inquiry.html', {'property': property})

@login_required
def toggle_favorite(request, pk):
    property = get_object_or_404(Property, pk=pk, is_verified=True)
    
    if property in request.user.favorite_properties.all():
        request.user.favorite_properties.remove(property)
        message = 'Property removed from favorites.'
    else:
        request.user.favorite_properties.add(property)
        message = 'Property added to favorites.'
    
    return JsonResponse({
        'status': 'success',
        'message': message
    })
